const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
await p.waitForTimeout(700);

// ① 몬스터 총량 제한
const mob=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.enterChapter(0);
  await new Promise(r=>setTimeout(r,400));
  const need=T.chapKillNeed(0);
  let spawned=0, seen=new Set();
  // 캠프 근처로 이동해 소환을 유도하며 즉시 처치
  for(let step=0; step<400; step++){
    const c=T.WD.camps[step%3]; T.P.x=c.x; T.P.y=c.y+200; T.P.invT=9;
    await new Promise(r=>setTimeout(r,26));
    T.EN.forEach(e=>{ if(e.alive&&!e.dead&&!e.boss){
      if(!seen.has(e.uid)){ seen.add(e.uid); spawned++; }
      e.hp=0; }});
  }
  await new Promise(r=>setTimeout(r,400));
  const pg=T.S.prog['0']||{};
  return {need, spawned, kills:pg.kills|0, aliveNow:T.EN.filter(e=>e.alive&&!e.dead).length};
});
console.log('=== 챕터당 몬스터 수 ===');
console.log('  목표 '+mob.need+'마리 / 실제 소환 '+mob.spawned+'마리 / 처치 '+mob.kills+' / 남은 '+mob.aliveNow);
console.log('  '+(mob.spawned<=mob.need+2 ? '✅ 무한 리젠 아님' : '❌ 초과 소환'));

// ② 콤보 : 허공 공격
const combo=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.EN.forEach(e=>e.alive=false);
  T.P.combo=0;
  for(let i=0;i<8;i++){ T.doAttack(T.P.x+500,T.P.y); await new Promise(r=>setTimeout(r,200)); }
  const air=T.P.combo;
  const e=T.spawnEnemy(T.WD.camps[0].mob);
  e.x=T.P.x+60; e.y=T.P.y; e.hp=e.hpMax=99999;
  T.P.combo=0;
  for(let i=0;i<5;i++){ e.x=T.P.x+60; e.y=T.P.y; T.doAttack(e.x,e.y); await new Promise(r=>setTimeout(r,220)); }
  return {air, hit:T.P.combo};
});
console.log('=== 콤보 ===');
console.log('  허공 8번 → 콤보 '+combo.air+' (0 이어야 정상)   실제 타격 5번 → 콤보 '+combo.hit);

// ③ 보스 크기/체력
const boss=await p.evaluate(()=>{
  const T=window.__TORI;
  const bk=T.chapBoss(9), mk=T.chapMobs(9)[0];
  const B=T.SPECIES[bk], M=T.SPECIES[mk];
  return {bn:B.n, bsz:B.sz, msz:M.sz, bhp:B.hp, mhp:M.hp, batk:B.atk, matk:M.atk};
});
console.log('=== 보스 ===');
console.log('  '+boss.bn+'  크기 '+boss.bsz+' (일반몹 '+boss.msz+', '+(boss.bsz/boss.msz).toFixed(1)+'배)');
console.log('  체력 '+boss.bhp+' (일반몹 '+boss.mhp+', '+(boss.bhp/boss.mhp).toFixed(1)+'배)   공격력 '+boss.batk+' ('+(boss.batk/boss.matk).toFixed(1)+'배)');

// ④ 무기별 이펙트 · 필살기
const fx=await p.evaluate(async()=>{
  const T=window.__TORI;
  const kinds=T.WEP_TYPE.map(w=>w.id);
  const out={};
  for(const k of kinds){
    const id=T.EQ_WEP.find(x=>T.WEP_TYPE[T.EQUIP[x].tn].id===k);
    T.S.eq[id]=1; T.S.eqW=id;
    T.PT && T.PT.forEach(q=>q.alive=false);
    const before=T.petsLive? 0:0;
    T.doAttack(T.P.x+120,T.P.y);
    await new Promise(r=>setTimeout(r,60));
    out[k]=T.particleCount? T.particleCount() : -1;
  }
  // 필살기
  T.S.ult=100; T.doUlt();
  await new Promise(r=>setTimeout(r,200));
  const u=T.ultFxOn? T.ultFxOn() : -1;
  return {out, ult:u};
});
console.log('=== 이펙트 ===');
console.log('  무기별 공격 파티클: '+JSON.stringify(fx.out));
console.log('  필살기 연출 활성: '+fx.ult);

// ⑤ 초기화
const rst=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.lv=77; T.S.acorn=12345; T.S.chap=30; T.S.star=999;
  T.openSheet('map',0);
  await new Promise(r=>setTimeout(r,320));
  const btns=[...document.querySelectorAll('#sheetBody .bigbtn')];
  const rb=btns[btns.length-1];
  const label1=rb? rb.textContent.trim():'없음';
  rb.click(); await new Promise(r=>setTimeout(r,300));
  const btns2=[...document.querySelectorAll('#sheetBody .bigbtn')];
  const rb2=btns2[btns2.length-1];
  const label2=rb2? rb2.textContent.trim():'없음';
  rb2.click(); await new Promise(r=>setTimeout(r,900));
  return {label1, label2, lv:T.S.lv, acorn:T.S.acorn, chap:T.S.chap, star:T.S.star,
    eq:Object.keys(T.S.eq||{}).length, pets:Object.keys(T.S.pets||{}).length};
});
console.log('=== 초기화 ===');
console.log('  버튼: "'+rst.label1+'" → "'+rst.label2+'"');
console.log('  결과: Lv'+rst.lv+' 도토리'+rst.acorn+' 별'+rst.star+' 챕터'+rst.chap+' 장비'+rst.eq+' 펫'+rst.pets);
console.log('  '+((rst.lv===1&&rst.acorn===0&&rst.chap===0&&rst.eq===0)? '✅ 완전 초기화' : '❌ 남은 데이터 있음'));
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
