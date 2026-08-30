/* 공격 버튼 반응성 전수 검증 */
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
/* 공격 성사 횟수는 게임 내부 카운터로 정확히 센다 */
await p.evaluate(()=>{ const T=window.__TORI;
  Object.defineProperty(window,'__swings',{ get(){ return T.dbg.atkN()-(window.__base||0); },
    set(v){ window.__base=T.dbg.atkN()-v; }, configurable:true });
  window.__swings=0; });

console.log('\n[A] 누르고 있으면 쉬지 않고 공격한다');
const hold = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.lv=30; T.enterChapter(0);
  for(let i=0;i<6;i++) T.spawnEnemy();
  await new Promise(z=>setTimeout(z,400));
  const ab=document.getElementById('btnAtk'), q=ab.getBoundingClientRect();
  const cx=q.left+q.width/2, cy=q.top+q.height/2;
  window.__swings=0;
  ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:1,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  await new Promise(z=>setTimeout(z,3000));      /* 3초 동안 꾹 */
  const n=window.__swings;
  ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:1,clientX:cx,clientY:cy,bubbles:true}));
  await new Promise(z=>setTimeout(z,600));
  const after=window.__swings;
  return {swings:n, afterRelease:after-n, cd:T.dbg.atkInfo? T.dbg.atkInfo() : null};
});
ok('3초간 꾹 누르면 5회 이상 공격', hold.swings>=5, hold.swings+'회');
ok('손을 떼면 즉시 멈춘다', hold.afterRelease<=1, '뗀 뒤 '+hold.afterRelease+'회');

console.log('\n[B] 손가락이 버튼 밖으로 살짝 밀려도 연사가 안 끊긴다');
const drift = await p.evaluate(async()=>{
  const T=window.__TORI;
  const ab=document.getElementById('btnAtk'), q=ab.getBoundingClientRect();
  const cx=q.left+q.width/2, cy=q.top+q.height/2;
  window.__swings=0;
  ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:2,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  await new Promise(z=>setTimeout(z,700));
  const a=window.__swings;
  /* 버튼 밖으로 나가는 상황 재현 */
  ab.dispatchEvent(new PointerEvent('pointerleave',{pointerId:2,clientX:cx-200,clientY:cy-200,bubbles:true}));
  ab.dispatchEvent(new PointerEvent('pointerout',{pointerId:2,clientX:cx-200,clientY:cy-200,bubbles:true}));
  await new Promise(z=>setTimeout(z,1600));
  const c=window.__swings;
  ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:2,clientX:cx,clientY:cy,bubbles:true}));
  return {before:a, afterLeave:c-a};
});
ok('버튼 밖으로 밀려도 계속 공격한다', drift.afterLeave>=3, JSON.stringify(drift));

console.log('\n[C] 누를 때마다 반드시 공격한다 (입력 버림 없음)');
const taps = await p.evaluate(async()=>{
  const T=window.__TORI;
  const ab=document.getElementById('btnAtk'), q=ab.getBoundingClientRect();
  const cx=q.left+q.width/2, cy=q.top+q.height/2;
  const out=[];
  /* 쿨다운의 여러 시점에서 톡 눌러 본다 */
  for(const wait of [40, 90, 150, 220, 300, 380, 460]){
    /* 쿨다운을 확실히 비운다 */
    await new Promise(z=>setTimeout(z,900));
    window.__swings=0;
    ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:30,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
    ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:30,clientX:cx,clientY:cy,bubbles:true}));
    await new Promise(z=>setTimeout(z,wait));        /* 쿨다운 도중에 두 번째 탭 */
    ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:31,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
    ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:31,clientX:cx,clientY:cy,bubbles:true}));
    await new Promise(z=>setTimeout(z,1000));        /* 버퍼가 소진될 시간 */
    out.push({wait, swings:window.__swings});
  }
  return out;
});
const lost = taps.filter(t=>t.swings<2);
ok('쿨다운 어느 시점에 눌러도 두 번 다 공격된다', lost.length===0,
   JSON.stringify(taps));

console.log('\n[D] 빠르게 연타해도 전부 반응한다');
const spam = await p.evaluate(async()=>{
  const ab=document.getElementById('btnAtk'), q=ab.getBoundingClientRect();
  const cx=q.left+q.width/2, cy=q.top+q.height/2;
  await new Promise(z=>setTimeout(z,900));
  window.__swings=0;
  for(let i=0;i<12;i++){
    ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:50+i,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
    ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:50+i,clientX:cx,clientY:cy,bubbles:true}));
    await new Promise(z=>setTimeout(z,110));
  }
  await new Promise(z=>setTimeout(z,900));
  return {swings:window.__swings};
});
ok('1.3초 동안 12번 연타 → 3회 이상 공격', spam.swings>=3, spam.swings+'회');

console.log('\n[E] 두 손가락으로 눌렀다 떼도 자동공격이 안 남는다');
const multi = await p.evaluate(async()=>{
  const ab=document.getElementById('btnAtk'), q=ab.getBoundingClientRect();
  const cx=q.left+q.width/2, cy=q.top+q.height/2;
  ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:70,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:71,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  await new Promise(z=>setTimeout(z,600));
  ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:70,clientX:cx,clientY:cy,bubbles:true}));
  ab.dispatchEvent(new PointerEvent('pointerup',{pointerId:71,clientX:cx,clientY:cy,bubbles:true}));
  await new Promise(z=>setTimeout(z,500));
  window.__swings=0;
  await new Promise(z=>setTimeout(z,1600));
  return {leak:window.__swings};
});
ok('두 손가락 뒤에도 자동공격 누수 없음', multi.leak===0, multi.leak+'회 남음');

console.log('\n[F] 스페이스바도 누르고 있으면 연속 공격');
const key = await p.evaluate(async()=>{
  await new Promise(z=>setTimeout(z,700));
  window.__swings=0;
  const down=new KeyboardEvent('keydown',{key:' ',bubbles:true});
  window.dispatchEvent(down);
  /* 브라우저 자동반복 없이 3초 유지 */
  await new Promise(z=>setTimeout(z,2600));
  const n=window.__swings;
  window.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true}));
  await new Promise(z=>setTimeout(z,700));
  return {swings:n, after:window.__swings-n};
});
ok('스페이스바를 누르고 있으면 연속 공격', key.swings>=4, key.swings+'회');
ok('스페이스바를 떼면 멈춘다', key.after<=1, '뗀 뒤 '+key.after+'회');

console.log('\n[G] 메뉴를 열면 공격이 멈춘다');
const sheet = await p.evaluate(async()=>{
  const T=window.__TORI;
  const ab=document.getElementById('btnAtk'), q=ab.getBoundingClientRect();
  ab.dispatchEvent(new PointerEvent('pointerdown',{pointerId:90,
    clientX:q.left+q.width/2, clientY:q.top+q.height/2, bubbles:true, cancelable:true}));
  await new Promise(z=>setTimeout(z,400));
  T.openSheet('bag');
  await new Promise(z=>setTimeout(z,300));
  window.__swings=0;
  await new Promise(z=>setTimeout(z,1200));
  const leak=window.__swings;
  T.closeSheet();
  await new Promise(z=>setTimeout(z,500));
  return {leak};
});
ok('메뉴가 열려 있으면 공격이 안 나간다', sheet.leak===0, sheet.leak+'회');

ok('공격 검증 중 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
