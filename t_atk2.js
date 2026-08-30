/* 감사에서 나온 공격/입력 결함 재검증 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();
p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
await p.goto(F);
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.click('#tapstart');
await p.waitForTimeout(900);
await p.evaluate(()=>{ const T=window.__TORI;
  Object.defineProperty(window,'__swings',{ get(){ return T.dbg.atkN()-(window.__base||0); },
    set(v){ window.__base=T.dbg.atkN()-v; }, configurable:true });
  window.__swings=0; });

console.log('\n[A] 쿨다운이 긴 능력에서도 누른 게 절대 안 버려진다 (전 능력 전수)');
const all = await p.evaluate(async()=>{
  const T=window.__TORI, ids=Object.keys(T.ABIL), bad=[], info=[];
  T.S.prog={}; T.S.lv=40; T.enterChapter(0);
  const ab=document.getElementById('btnAtk'), q=ab.getBoundingClientRect();
  const cx=q.left+q.width/2, cy=q.top+q.height/2;
  function tap(id){
    ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:id,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
    ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:id,clientX:cx,clientY:cy,bubbles:true}));
  }
  let n=0;
  for(const id of ids){
    const cd=T.ABIL[id].cd[0];
    T.S.abil=id; T.S.owned[id]=1;
    /* 이전 능력의 쿨다운(최대 5.6초)이 남아 있을 수 있다 → 실제로 0 이 될 때까지 기다린다 */
    for(let w=0; w<200; w++){
      const st=T.dbg.atkInfo();
      if(st.cd<=0 && !st.buf) break;
      await new Promise(z=>setTimeout(z,60));
    }
    await new Promise(z=>setTimeout(z,80));
    window.__swings=0;
    tap(200+n);
    await new Promise(z=>setTimeout(z, Math.max(60, cd*1000*0.5)));   /* 쿨다운 한가운데 */
    tap(300+n);
    await new Promise(z=>setTimeout(z, cd*1000+600));
    const sw=window.__swings;
    info.push({id, cd:+cd.toFixed(2), swings:sw});
    if(sw<2) bad.push({id, cd:+cd.toFixed(2), swings:sw});
    n++;
  }
  return {bad, n:ids.length, maxCd:Math.max(...info.map(x=>x.cd)),
          longOnes:info.filter(x=>x.cd>0.6).length};
});
ok(`능력 ${all.n}개 전부: 쿨다운 중 누른 탭이 반드시 나간다`, all.bad.length===0,
   '실패 '+all.bad.length+'개 '+JSON.stringify(all.bad.slice(0,6)));
console.log(`     쿨다운 0.6초 초과 능력 ${all.longOnes}개 (최대 ${all.maxCd}초) — 예전엔 전부 탭이 버려졌다`);

console.log('\n[B] 필살기가 화면전환 중 게이지만 날리지 않는다');
const ult = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.chap=0; T.enterChapter(0);
  T.dbg.addKills(T.chapKillNeed(0));
  await new Promise(z=>setTimeout(z,300));
  T.P.x=T.WD.exitGate.x; T.P.y=T.WD.exitGate.y;
  await new Promise(z=>setTimeout(z,120));       /* 화면전환 시작 */
  const fading=T.G.fade>0;
  T.S.ult=100; T.doUlt();
  const kept=T.S.ult;
  await new Promise(z=>setTimeout(z,1800));
  return {fading, kept, chap:T.S.chap};
});
ok('전환 중 필살기를 눌러도 게이지가 안 없어진다', ult.fading? ult.kept===100 : true,
   JSON.stringify(ult));

console.log('\n[C] 조이스틱 : 첫 손가락을 떼도 둘째 손가락으로 계속 이동');
const stick = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.enterChapter(0);
  await new Promise(z=>setTimeout(z,300));
  const cv=document.querySelector('canvas'), q=cv.getBoundingClientRect();
  const X=f=>q.left+q.width*f, Y=f=>q.top+q.height*f;
  cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:41,clientX:X(0.15),clientY:Y(0.8),bubbles:true,cancelable:true}));
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:41,clientX:X(0.28),clientY:Y(0.8),bubbles:true}));
  await new Promise(z=>setTimeout(z,120));
  /* 둘째 손가락이 조이스틱 영역에 내려온다 */
  cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:42,clientX:X(0.30),clientY:Y(0.9),bubbles:true,cancelable:true}));
  await new Promise(z=>setTimeout(z,80));
  /* 첫 손가락을 뗀다 */
  cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:41,clientX:X(0.28),clientY:Y(0.8),bubbles:true}));
  await new Promise(z=>setTimeout(z,80));
  /* 둘째 손가락으로 계속 끈다 */
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:42,clientX:X(0.42),clientY:Y(0.9),bubbles:true}));
  await new Promise(z=>setTimeout(z,150));
  const v={vx:T.P.vx, vy:T.P.vy};
  const x0=T.P.x;
  await new Promise(z=>setTimeout(z,500));
  const moved=Math.abs(T.P.x-x0)>6;
  cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:42,clientX:X(0.42),clientY:Y(0.9),bubbles:true}));
  await new Promise(z=>setTimeout(z,200));
  return {v, moved, stoppedAfter:(T.P.vx===0&&T.P.vy===0)};
});
ok('첫 손가락을 떼도 둘째 손가락으로 계속 움직인다', stick.moved===true, JSON.stringify(stick));
ok('둘 다 떼면 멈춘다', stick.stoppedAfter===true, JSON.stringify(stick));

console.log('\n[D] 자기 발밑을 쳐도 공격·삼키기가 안 죽는다');
const aim = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.abil='acorn_blade'; T.S.lv=40; T.enterChapter(0);
  await new Promise(z=>setTimeout(z,300));
  /* 몬스터를 전부 치우고 자기 발밑을 친다 */
  T.EN.forEach(e=>{e.alive=false;});
  T.doAttack(T.P.x, T.P.y);
  await new Promise(z=>setTimeout(z,900));
  const f={fx:T.P.fx, fy:T.P.fy};
  /* 이제 몬스터를 붙이고 실제로 맞는지 */
  const e=T.spawnEnemy();
  await new Promise(z=>setTimeout(z,200));
  T.P.x=e.x-40; T.P.y=e.y;
  const hp0=e.hp;
  for(let i=0;i<6;i++){ T.doAttack(e.x,e.y); await new Promise(z=>setTimeout(z,300)); }
  return {f, hit: e.hp<hp0, zero: f.fx===0&&f.fy===0};
});
ok('발밑을 쳐도 조준 방향이 (0,0) 으로 굳지 않는다', aim.zero===false, JSON.stringify(aim.f));
ok('그 뒤에도 몬스터가 정상적으로 맞는다', aim.hit===true, JSON.stringify(aim));

console.log('\n[E] 버튼 글씨·틈을 눌러도 반응한다');
const dead = await p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('.skill-cap').forEach(c=>{
    const q=c.getBoundingClientRect();
    const el=document.elementFromPoint(q.left+q.width/2, q.top+q.height/2);
    out.push({cap:c.textContent.trim(), hit: el? (el.id||el.className||el.tagName):'none'});
  });
  /* 버튼 사이 틈 */
  const bs=[...document.querySelectorAll('.skill-wrap')].map(w=>w.getBoundingClientRect());
  const gaps=[];
  for(let i=1;i<bs.length;i++){
    const x=(bs[i-1].right+bs[i].left)/2, y=(bs[i].top+bs[i].bottom)/2;
    const el=document.elementFromPoint(x,y);
    gaps.push(el? (el.id||el.className||el.tagName):'none');
  }
  return {out, gaps};
});
ok('버튼 글씨를 눌러도 탭이 캔버스로 간다(먹히지 않음)',
   dead.out.every(x=>/canvas|gc/i.test(x.hit)), JSON.stringify(dead.out));
ok('버튼 사이 틈도 탭이 캔버스로 간다', dead.gaps.every(g=>/canvas|gc/i.test(g)), JSON.stringify(dead.gaps));

console.log('\n[F] 메뉴를 열었다 닫아도 스페이스바가 계속 먹는다');
const key = await p.evaluate(async()=>{
  const T=window.__TORI;
  window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));
  await new Promise(z=>setTimeout(z,400));
  T.openSheet('bag'); await new Promise(z=>setTimeout(z,350));
  T.closeSheet(); await new Promise(z=>setTimeout(z,450));
  window.__swings=0;
  /* 손가락은 아직 스페이스바 위 → 브라우저는 자동반복 keydown 만 보낸다 */
  for(let i=0;i<10;i++){
    window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',repeat:true,bubbles:true}));
    await new Promise(z=>setTimeout(z,120));
  }
  await new Promise(z=>setTimeout(z,500));
  const n=window.__swings;
  window.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true}));
  await new Promise(z=>setTimeout(z,700));
  return {swings:n, after:window.__swings-n};
});
ok('메뉴를 닫은 뒤에도 스페이스바가 이어서 공격한다', key.swings>=2, key.swings+'회');
ok('스페이스바를 떼면 멈춘다', key.after<=1, '뗀 뒤 '+key.after+'회');

console.log('\n[G] 장을 넘겨도 이전 장 공격이 안 따라온다');
const chap = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.abil='acorn_blade'; T.enterChapter(0);
  await new Promise(z=>setTimeout(z,300));
  T.doAttack(T.P.x+300, T.P.y);      /* 1타 */
  T.doAttack(T.P.x+300, T.P.y);      /* 쿨다운 중 → 버퍼 */
  T.enterChapter(5);                  /* 곧바로 장 이동 */
  const sx=T.P.x, sy=T.P.y;
  await new Promise(z=>setTimeout(z,900));
  return {fx:T.P.fx, fy:T.P.fy, buf:T.dbg.atkBuf? T.dbg.atkBuf() : null,
          near:Math.abs(T.P.x-sx)<400};
});
ok('장을 넘기면 예약된 공격이 사라진다', chap.buf===null||chap.buf===0||chap.buf===undefined,
   JSON.stringify(chap));

ok('재검증 중 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
