/* 전체화면 검증 : 시작하면 주소창·상태바 없이 화면을 꽉 채워야 한다 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream']});

console.log('\n[A] 시작 버튼을 누르면 전체화면이 된다');
for(const [nm,w,h,d] of [['갤A9+ 393',393,808,2.75],['갤탭 가로 1280',1280,800,1.5],['PC 1440',1440,900,1]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const before = await p.evaluate(()=>!!document.fullscreenElement);
  /* 실제 신뢰된 클릭 (합성 이벤트로는 전체화면이 허용되지 않는다) */
  await p.click('#tapstart');
  await p.waitForTimeout(900);
  const r = await p.evaluate(()=>({
    fs: !!document.fullscreenElement,
    el: document.fullscreenElement? document.fullscreenElement.tagName : null,
    playing: window.__TORI.G.state,
    W: window.innerWidth, H: window.innerHeight,
    canvasFills: (function(){ const c=document.querySelector('canvas'), q=c.getBoundingClientRect();
      return Math.abs(q.width-window.innerWidth)<=2 && Math.abs(q.height-window.innerHeight)<=2; })()
  }));
  ok(`${nm}: 시작 전에는 전체화면이 아니다`, before===false);
  ok(`${nm}: 시작 버튼 한 번으로 전체화면 진입`, r.fs===true, JSON.stringify(r));
  ok(`${nm}: 전체화면 대상이 문서 전체(<html>)`, r.el==='HTML', String(r.el));
  ok(`${nm}: 캔버스가 화면을 꽉 채운다`, r.canvasFills===true, JSON.stringify(r));
  ok(`${nm}: 전체화면 진입 중 에러 없음`, p.__errs.length===0, p.__errs.slice(0,2).join(' | '));
  await ctx.close();
}

console.log('\n[B] 전체화면이 되어도 게임이 정상 동작');
{
  const ctx=await b.newContext({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.click('#tapstart');
  await p.waitForTimeout(1000);
  const r = await p.evaluate(async()=>{
    const T=window.__TORI;
    const cv=document.querySelector('canvas'), q=cv.getBoundingClientRect();
    const lx=q.left+q.width*0.18, ly=q.top+q.height*0.78;
    const x0=T.P.x, y0=T.P.y;
    cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:3,clientX:lx,clientY:ly,bubbles:true,cancelable:true}));
    cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:3,clientX:lx+70,clientY:ly,bubbles:true}));
    await new Promise(z=>setTimeout(z,600));
    cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:3,clientX:lx+70,clientY:ly,bubbles:true}));
    return {moved: Math.hypot(T.P.x-x0,T.P.y-y0)>8, fs:!!document.fullscreenElement,
            uiOut:(function(){ const W=innerWidth,H=innerHeight; let n=0;
              document.querySelectorAll('.hud,.dock,#btnAtk,#btnUlt,#btnInh,.mbtn').forEach(e=>{
                const b2=e.getBoundingClientRect(); if(b2.width<2) return;
                if(b2.left<-1||b2.top<-1||b2.right>W+1||b2.bottom>H+1) n++; }); return n; })()};
  });
  ok('전체화면에서 캐릭터가 정상 이동', r.moved===true, JSON.stringify(r));
  ok('전체화면에서 UI가 화면 밖으로 안 나간다', r.uiOut===0, 'UI 벗어남 '+r.uiOut+'개');
  ok('게임 중에도 전체화면 유지', r.fs===true);

  /* 시트를 열고 닫아도 전체화면이 유지되는지 */
  const sh = await p.evaluate(async()=>{
    const T=window.__TORI;
    T.openSheet('bag'); await new Promise(z=>setTimeout(z,400));
    const a=!!document.fullscreenElement;
    T.closeSheet(); await new Promise(z=>setTimeout(z,400));
    return {inSheet:a, after:!!document.fullscreenElement};
  });
  ok('메뉴를 열고 닫아도 전체화면 유지', sh.inSheet===true && sh.after===true, JSON.stringify(sh));

  /* 사용자가 직접 나가면 자동 재진입하지 않아야 한다 (강제로 끌고 들어가면 불쾌) */
  const quit = await p.evaluate(async()=>{
    await document.exitFullscreen().catch(()=>{});
    await new Promise(z=>setTimeout(z,400));
    const cv=document.querySelector('canvas'), q=cv.getBoundingClientRect();
    for(let i=0;i<4;i++){
      cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:20+i,
        clientX:q.left+q.width*0.5, clientY:q.top+q.height*0.5, bubbles:true, cancelable:true}));
      cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:20+i,
        clientX:q.left+q.width*0.5, clientY:q.top+q.height*0.5, bubbles:true}));
      await new Promise(z=>setTimeout(z,150));
    }
    return {fs:!!document.fullscreenElement};
  });
  ok('직접 나간 뒤에는 강제로 다시 안 들어간다', quit.fs===false, JSON.stringify(quit));
  ok('전체화면 검증 중 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
  await ctx.close();
}

console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
