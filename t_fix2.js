/* 정밀 감사에서 나온 결함 전수 재검증 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
await p.goto(F);
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(400);

console.log('\n[1] 잠긴 문은 절대 통과 못 한다 (110장 전수)');
const gates = await p.evaluate(()=>{
  const T=window.__TORI, bad=[];
  for(let c=0;c<110;c++){
    T.S.prog={}; T.S.chap=c; T.enterChapter(c);
    const eg=T.WD.props[T.WD.exitGateProp];
    const rec={c:c+1};
    if(!(eg.solid===1 && eg.r>0 && eg.k==='gate')) rec.exit={k:eg.k,solid:eg.solid,r:eg.r};
    if(T.WD.arenaGateProp>=0){
      const ag=T.WD.props[T.WD.arenaGateProp];
      if(!(ag.solid===1 && ag.r>0 && ag.k==='bgate')) rec.boss={k:ag.k,solid:ag.solid,r:ag.r};
    }
    if(rec.exit||rec.boss) bad.push(rec);
  }
  return bad;
});
ok('쿼터 전 다음 숲 문이 모든 장에서 실제로 막혀 있다', gates.length===0,
   '문제 '+gates.length+'장: '+JSON.stringify(gates.slice(0,5)));

console.log('\n[2] 물리적으로도 못 지나간다 (충돌 판정 확인)');
const phys = await p.evaluate(()=>{
  const T=window.__TORI, bad=[];
  for(const c of [0,4,9,14,29,55,88,109]){
    T.S.prog={}; T.S.chap=c; T.enterChapter(c);
    const g=T.WD.exitGate;
    if(!T.dbg.blocked(g.x,g.y,10)) bad.push({c:c+1,gate:'exit'});
    if(T.WD.arenaGateProp>=0 && !T.dbg.blocked(T.WD.arenaGate.x,T.WD.arenaGate.y,10))
      bad.push({c:c+1,gate:'boss'});
  }
  return bad;
});
ok('잠긴 문 위치가 실제 충돌로 막혀 있다', phys.length===0, JSON.stringify(phys));

console.log('\n[3] 공격버튼 두 손가락 → 자동공격 누수');
const atk = await p.evaluate(async()=>{
  const T=window.__TORI, ab=document.getElementById('btnAtk');
  const r=ab.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  const dn=id=>ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:id,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  const up=id=>ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:id,clientX:cx,clientY:cy,bubbles:true}));
  dn(1); dn(2);                    /* 두 손가락 */
  await new Promise(r=>setTimeout(r,400));
  up(1); up(2);                    /* 둘 다 뗌 */
  await new Promise(r=>setTimeout(r,500));
  const before=T.P.atkT!==undefined?T.P.atkT:0;
  const c1=T.dbg.prog().kills;
  const n1=T.PT.filter(x=>x.alive).length;
  await new Promise(r=>setTimeout(r,900));
  const n2=T.PT.filter(x=>x.alive).length;
  /* 자동공격이 남아 있으면 공격 이펙트 파티클이 계속 생성된다 */
  return {stillAttacking: T.__atkAlive===true, n1, n2};
});
/* 더 확실한 판정 : 손 뗀 뒤 콤보가 계속 오르는지 */
const combo = await p.evaluate(async()=>{
  const T=window.__TORI, ab=document.getElementById('btnAtk');
  const r=ab.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  const dn=id=>ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:id,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  const up=id=>ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:id,clientX:cx,clientY:cy,bubbles:true}));
  T.S.prog={}; T.enterChapter(0);
  for(let i=0;i<6;i++) T.spawnEnemy();
  await new Promise(r=>setTimeout(r,200));
  dn(1); dn(2); dn(3);
  await new Promise(r=>setTimeout(r,500));
  up(1); up(2); up(3);
  await new Promise(r=>setTimeout(r,300));
  const a=T.dbg.prog().kills, hp=T.EN.filter(e=>e.alive&&!e.dead).map(e=>e.hp);
  await new Promise(r=>setTimeout(r,1500));
  const b2=T.dbg.prog().kills, hp2=T.EN.filter(e=>e.alive&&!e.dead).map(e=>e.hp);
  const damaged = hp.length===hp2.length && hp.some((v,i)=>hp2[i]<v);
  return {killsBefore:a, killsAfter:b2, damaged};
});
ok('손을 뗀 뒤 공격이 완전히 멈춘다(자동공격 누수 없음)',
   combo.killsAfter===combo.killsBefore && !combo.damaged, JSON.stringify(combo));

console.log('\n[4] 화면 회전해도 중간보스 몸집 유지');
const sz = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.chap=4; T.enterChapter(4);
  T.dbg.addKills(T.chapKillNeed(4));
  T.P.x=T.WD.arena.x; T.P.y=T.WD.arena.y;
  await new Promise(r=>setTimeout(r,900));
  const bs=T.EN.find(e=>e.alive&&!e.dead&&e.boss);
  if(!bs) return {no:1};
  const s1=bs.size;
  T.layout();                       /* 회전/품질변경과 동일한 경로 */
  const s2=bs.size;
  return {s1, s2, mid:!!bs.mid};
});
ok('layout() 후에도 중간보스가 1.75배 크기를 유지', sz.no!==1 && sz.s1===sz.s2 && sz.mid,
   JSON.stringify(sz));

console.log('\n[5] 펫 해시 충돌 (q9 ↔ q90)');
const pet = await p.evaluate(()=>{
  const T=window.__TORI;
  const ids=T.PET_IDS.slice();
  const a=ids.find(x=>x==='q9')||ids[9], b2=ids.find(x=>x==='q90')||ids[90];
  if(!a||!b2) return {skip:1};
  T.S.pets={}; T.S.pets[a]=1; T.S.pets[b2]=1;
  T.S.petSlot=[a]; const ba=JSON.stringify(T.petBonus());
  T.S.petSlot=[b2]; const bb=JSON.stringify(T.petBonus());
  return {a, b:b2, ga:T.PETS[a].grade, gb:T.PETS[b2].grade, same: ba===bb,
          bonusA:JSON.parse(ba), bonusB:JSON.parse(bb)};
});
ok('등급이 다른 펫으로 바꾸면 능력치가 실제로 바뀐다',
   pet.skip===1 || pet.ga===pet.gb || !pet.same,
   JSON.stringify({a:pet.a,b:pet.b,ga:pet.ga,gb:pet.gb,same:pet.same}));

console.log('\n[6] 벽 밀고 있어도 순간이동 반복 안 함');
const stuck = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.chap=0; T.enterChapter(0);
  await new Promise(r=>setTimeout(r,200));
  /* 솔리드 소품 옆에 붙여 놓고 계속 밀어 본다 */
  let target=null;
  for(const pr of T.WD.props) if(pr.solid && pr.r>20){ target=pr; break; }
  if(!target) return {skip:1};
  T.P.x=target.x; T.P.y=target.y+target.r+22;
  const jumps=[]; let lx=T.P.x, ly=T.P.y;
  for(let i=0;i<200;i++){
    T.P.vx=0; T.P.vy=-1;                      /* 벽 쪽으로 계속 밀기 */
    await new Promise(r=>requestAnimationFrame(r));
    const d=Math.abs(T.P.x-lx)+Math.abs(T.P.y-ly);
    if(d>30) jumps.push(Math.round(d));
    lx=T.P.x; ly=T.P.y;
  }
  return {jumps, n:jumps.length};
});
ok('3초간 벽을 밀어도 순간이동이 1회 이하', stuck.skip===1 || stuck.n<=1,
   JSON.stringify(stuck));

console.log('\n[7] 마지막 110장');
const last = await p.evaluate(async()=>{
  const T=window.__TORI, D=T.dbg;
  T.S.prog={}; T.S.chap=109; T.enterChapter(109);
  D.addKills(T.chapKillNeed(109));
  T.P.x=T.WD.arena.x; T.P.y=T.WD.arena.y;
  await new Promise(r=>setTimeout(r,900));
  D.onBossDefeated();
  const o1=D.objectiveText(), open1=T.WD.exitGate.open;
  T.P.x=T.WD.exitGate.x; T.P.y=T.WD.exitGate.y;
  await new Promise(r=>setTimeout(r,1200));
  return {obj:o1, open1, openAfter:T.WD.exitGate.open, obj2:D.objectiveText(),
          chap:T.S.chap, shake:T.G? 0:0};
});
ok('110장 클리어 후 목표 문구와 문 상태가 일치', last.open1===true && last.openAfter===true &&
   last.obj==='모두 클리어! 🎉' && last.obj2==='모두 클리어! 🎉' && last.chap===109,
   JSON.stringify(last));

console.log('\n[8] 지도로 보스를 건너뛸 수 없다');
const skip = await p.evaluate(()=>{
  const T=window.__TORI;
  T.S.prog={'9':{kills:T.chapKillNeed(9), boss:0, qm:1, chests:{}}};
  const a=T.dbg.chapIsAnyBoss(9);
  const beforeBoss=(function(){ /* chapUnlocked 는 노출 안 되어 있으니 지도 셀로 확인 */
    T.S.chap=9; T.enterChapter(9); T.openSheet('map'); return 1; })();
  const cells=[...document.querySelectorAll('#sheetBody .cell')].map(c=>({
    n:(c.querySelector('div')||{}).textContent, locked:c.className.indexOf('locked')>=0 }));
  T.closeSheet();
  const c11=cells.find(x=>x.n && x.n.trim()==='11');
  return {c11, isBossChap:a};
});
ok('보스를 안 잡으면 11장이 지도에서 잠겨 있다', skip.c11 && skip.c11.locked===true,
   JSON.stringify(skip));

console.log('\n[9] 도감 열기 멈춤');
const codex = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.codex={};                       /* 아무것도 못 본 상태 */
  const t0=performance.now();
  T.openSheet('book'); await new Promise(r=>setTimeout(r,300));
  const t1=performance.now();
  const imgs=document.querySelectorAll('#sheetBody .cell canvas, #sheetBody .cell img').length;
  T.closeSheet();
  return {ms:Math.round(t1-t0), imgs};
});
ok('못 본 몬스터는 아이콘을 굽지 않는다(멈춤 제거)', codex.imgs===0, JSON.stringify(codex));

console.log('\n[10] 필살기 직후 장 이동 → 새 장 오염 없음');
const cross = await p.evaluate(async()=>{
  const T=window.__TORI, D=T.dbg;
  T.S.prog={}; T.S.chap=0; T.S.lv=60; T.enterChapter(0);
  for(let i=0;i<8;i++) T.spawnEnemy();
  await new Promise(r=>setTimeout(r,250));
  T.S.ult=100; T.doUlt();
  T.enterChapter(3);                  /* 필살기 피해가 예약된 채 장 이동 */
  const k0=D.prog().kills;
  await new Promise(r=>setTimeout(r,1400));
  return {k0, k1:D.prog().kills, dn:(T.PT.filter(x=>x.alive).length)};
});
ok('장을 넘긴 뒤 이전 장의 필살기 피해가 안 들어온다', cross.k1===cross.k0,
   JSON.stringify(cross));

console.log('\n[11] 세이브 버전이 올라가도 진행이 유지된다');
{
  /* 게임이 돌면서 덮어쓰지 않도록 별도 페이지에서 검사한다 */
  const p2=await b.newPage({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  p2.__errs=[]; p2.on('pageerror',e=>p2.__errs.push(e.message));
  await p2.goto(F);
  await p2.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const key = await p2.evaluate(()=>{
    const T=window.__TORI;
    T.S.lv=42; T.S.chap=17; T.S.acorn=4242;
    T.S.prog={'0':{kills:99,boss:1,qm:1,chests:{}}};
    T.save();
    const k=Object.keys(localStorage).find(x=>/tori/i.test(x));
    const raw=JSON.parse(localStorage.getItem(k));
    raw.ver=(raw.ver|0)-1;                 /* 구버전으로 위조 */
    delete raw.gachaBonus;                 /* 새 버전에 추가된 항목이 없는 상황도 재현 */
    localStorage.setItem(k, JSON.stringify(raw));
    return k;
  });
  await p2.evaluate(()=>{ window.__NOSAVE=1; });
  await p2.goto('about:blank');            /* 언로드 저장 없이 확실히 떠난다 */
  await p2.goto(F);
  await p2.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const after = await p2.evaluate(()=>({lv:window.__TORI.S.lv, chap:window.__TORI.S.chap,
    acorn:window.__TORI.S.acorn, prog:window.__TORI.S.prog['0'],
    gb:window.__TORI.S.gachaBonus, ver:window.__TORI.S.ver}));
  ok('구버전 세이브가 초기화되지 않고 이어진다',
     after.lv===42 && after.chap===17 && after.acorn===4242 && after.prog && after.prog.boss===1,
     JSON.stringify(after));
  ok('구버전에 없던 항목은 기본값으로 채워진다', after.gb===0, JSON.stringify(after));
  await p2.close();
}
ok('전체 재검증 중 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,4).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
