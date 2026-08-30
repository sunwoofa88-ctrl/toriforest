const {chromium}=require('playwright');
let pass=0,fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const e=[];p.on('pageerror',x=>{if(e.indexOf(x.message)<0)e.push(x.message)});
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text())){const t=m.text().slice(0,140);if(e.indexOf(t)<0)e.push(t)}});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(700);

// 1) 확률 검증 : 3만회 시뮬
const dist=await p.evaluate(()=>{
  const T=window.__TORI, S=T.S;
  const cnt=[0,0,0,0,0]; let pity20ok=true, maxGapU=0, gap=0;
  S.gacha={day:'x',used:0,total:0,pity:0,pityL:0};
  for(let i=0;i<30000;i++){
    S.gacha.day='x'; S.gacha.used=0;      // 일일 제한 해제하고 확률만 측정
    const r=T.doGacha();
    if(!r) break;
    cnt[r.grade]++;
    if(r.grade>=2){ if(gap>maxGapU) maxGapU=gap; gap=0; } else gap++;
  }
  const tot=cnt.reduce((a,c)=>a+c,0);
  return {cnt, tot, pct:cnt.map(c=>(c/tot*100).toFixed(2)), maxGapU};
});
console.log('     30,000회 분포:', dist.pct.map((v,i)=>['N','R','U','SU','L'][i]+' '+v+'%').join(' | '));
ok('노멀 55% 근사', Math.abs(dist.pct[0]-55)<2.5, dist.pct[0]);
ok('레어 30% 근사', Math.abs(dist.pct[1]-30)<2.5, dist.pct[1]);
ok('유니크 11% 이상', dist.pct[2]>=10.5, dist.pct[2]);
ok('슈퍼유니크 3.5% 근사', Math.abs(dist.pct[3]-3.5)<1.2, dist.pct[3]);
ok('레전드 등장', dist.cnt[4]>0, dist.cnt[4]+'회 ('+dist.pct[4]+'%)');
ok('천장: 유니크 이상 20회 내 보장', dist.maxGapU<20, '최대 연속 미획득 '+dist.maxGapU);

// 2) 하루 5회 제한
await p.evaluate(()=>{ const T=window.__TORI; T.S.gacha=null; T.S.pets={}; T.S.petSlot=[]; });
const daily=await p.evaluate(()=>{
  const T=window.__TORI; let n=0;
  for(let i=0;i<20;i++){ if(T.doGacha()) n++; }
  return {n, left:T.gachaLeft()};
});
ok('하루 5회 제한', daily.n===5 && daily.left===0, JSON.stringify(daily));

// 3) 펫 버프 · 자동 습득
const buff=await p.evaluate(()=>{
  const T=window.__TORI, S=T.S;
  S.pets={}; S.petSlot=[];
  // 레전드 3마리 강제 장착
  const L=Object.keys(T.PETS).filter(id=>T.PETS[id].grade===4).slice(0,3);
  L.forEach(id=>{S.pets[id]=1;S.petSlot.push(id);});
  T.rebuildPets();
  const b=JSON.parse(JSON.stringify(T.petBonus()));
  return {b, pets:T.PETS[L[0]].txt, live:T.petsLive()};
});
console.log('     레전드 3장착 보너스:', JSON.stringify(buff.b));
ok('자동 습득 반경 적용', buff.b.pickup>0, 'pickup='+buff.b.pickup);
ok('도토리 보너스 적용', buff.b.acorn>0.5, 'acorn='+buff.b.acorn.toFixed(2));
ok('펫 3마리 활성', buff.live===3, ''+buff.live);
ok('펫마다 개성 버프 문구', /·/.test(buff.pets), buff.pets);

// 4) 실제 자동 습득 동작
const pick=await p.evaluate(async()=>{
  const T=window.__TORI;
  const before=T.S.acorn;
  for(let i=0;i<6;i++) T.dropLoot(T.P.x+300, T.P.y+200, 'acorn', 10);
  await new Promise(r=>setTimeout(r,2500));
  return {gained:T.S.acorn-before, left:T.LT?T.LT.filter(l=>l.alive).length:-1};
});
ok('멀리 떨어진 아이템도 자동 습득', pick.gained>0, JSON.stringify(pick));

// 5) 펫 없을 때는 자동 습득 안 됨(직접 주워야)
const noPet=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.petSlot=[]; T.rebuildPets();
  const before=T.S.acorn;
  for(let i=0;i<4;i++) T.dropLoot(T.P.x+300, T.P.y+200, 'acorn', 10);
  await new Promise(r=>setTimeout(r,2200));
  return T.S.acorn-before;
});
ok('펫이 없으면 멀리 있는 건 안 주워짐', noPet===0, '획득 '+noPet);

await p.evaluate(()=>{const T=window.__TORI;T.S.gacha=null;T.openSheet('bag',3);});
await p.waitForTimeout(600); await p.screenshot({path:'G_tab.png'});
await p.evaluate(()=>window.__TORI.openSheet('bag',2)); await p.waitForTimeout(600);
await p.screenshot({path:'G_own.png'});
console.log(e.length?'ERRORS:\n'+e.join('\n'):'  ✅ 에러 없음');
if(!e.length)pass++; else fail++;
console.log(`\n═══ 통과 ${pass} / 실패 ${fail} ═══`);
await b.close();})();
