/* 전체화면 : 자동 진입 + 수동 버튼 + 실패 대비 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();

console.log('\n[A] 정상 진입 시 : 전체화면 버튼이 안 보인다');
{
  const ctx=await b.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.click('#tapstart');
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>({fs:!!document.fullscreenElement,
    fullHidden:document.getElementById('btnFull').classList.contains('hidden'),
    exitShown:!document.getElementById('btnExit').classList.contains('hidden')}));
  ok('시작하면 전체화면이 된다', r.fs===true, JSON.stringify(r));
  ok('전체화면일 때는 ⛶ 버튼을 숨긴다', r.fullHidden===true, JSON.stringify(r));
  ok('종료 ✕ 버튼은 보인다', r.exitShown===true);
  /* 전체화면에서 나오면 ⛶ 버튼이 다시 나타나야 한다 */
  await p.evaluate(()=>document.exitFullscreen().catch(()=>{}));
  await p.waitForTimeout(500);
  const r2=await p.evaluate(()=>({fs:!!document.fullscreenElement,
    fullShown:!document.getElementById('btnFull').classList.contains('hidden')}));
  ok('전체화면에서 나오면 ⛶ 버튼이 나타난다', r2.fs===false && r2.fullShown===true, JSON.stringify(r2));
  /* ⛶ 버튼으로 다시 들어간다 */
  await p.click('#btnFull');
  await p.waitForTimeout(700);
  const r3=await p.evaluate(()=>({fs:!!document.fullscreenElement,
    fullHidden:document.getElementById('btnFull').classList.contains('hidden')}));
  ok('⛶ 버튼을 누르면 다시 전체화면이 된다', r3.fs===true, JSON.stringify(r3));
  ok('다시 들어가면 ⛶ 버튼이 숨는다', r3.fullHidden===true, JSON.stringify(r3));
  ok('에러 없음', p.__errs.length===0, p.__errs.slice(0,2).join(' | '));
  await ctx.close();
}

console.log('\n[B] 브라우저가 전체화면을 막는 경우 (카톡 내장 브라우저 등)');
{
  const ctx=await b.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  /* requestFullscreen 이 항상 거절되도록 흉내낸다 */
  await p.addInitScript(()=>{
    const rej=function(){ return Promise.reject(new Error('blocked')); };
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:rej,configurable:true});
    Object.defineProperty(Element.prototype,'webkitRequestFullscreen',{value:rej,configurable:true});
  });
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.click('#tapstart');
  await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>({fs:!!document.fullscreenElement,
    fullShown:!document.getElementById('btnFull').classList.contains('hidden'),
    playing:window.__TORI.G.state}));
  ok('막혀도 게임은 정상 시작된다', r.playing==='play', JSON.stringify(r));
  ok('막히면 ⛶ 버튼이 눈에 띄게 나타난다', r.fullShown===true, JSON.stringify(r));
  /* 눌러도 안 되면 안내 토스트 */
  await p.evaluate(()=>{ window.__T=[]; new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)
    if(n.nodeType===1&&n.className&&/toast/.test(n.className))window.__T.push(n.textContent.trim());})
    .observe(document.body,{childList:true,subtree:true}); });
  await p.click('#btnFull');
  await p.waitForTimeout(1200);
  const t=await p.evaluate(()=>window.__T.slice());
  ok('안 되면 "크롬으로 열어라" 안내가 뜬다', t.some(x=>/크롬/.test(x)), JSON.stringify(t));
  ok('막힌 상태에서도 에러 없음', p.__errs.length===0, p.__errs.slice(0,2).join(' | '));

  /* 게임이 여전히 잘 되는지 */
  const play=await p.evaluate(async()=>{
    const T=window.__TORI;
    const cv=document.querySelector('canvas'), q=cv.getBoundingClientRect();
    const x0=T.P.x;
    cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:9,clientX:q.left+q.width*0.18,clientY:q.top+q.height*0.78,bubbles:true,cancelable:true}));
    cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:9,clientX:q.left+q.width*0.30,clientY:q.top+q.height*0.78,bubbles:true}));
    await new Promise(z=>setTimeout(z,600));
    cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:9,clientX:q.left+q.width*0.30,clientY:q.top+q.height*0.78,bubbles:true}));
    return {moved:Math.abs(T.P.x-x0)>8};
  });
  ok('전체화면이 막혀도 조작은 정상', play.moved===true, JSON.stringify(play));
  await ctx.close();
}

console.log('\n[C] 버튼 두 개가 겹치지 않고 화면 안에 있다 (기기 6종)');
for(const [nm,w,h,d] of [['소형폰 320',320,568,2],['갤A9+ 393',393,808,2.75],['폰 가로 808',808,393,2.75],
                          ['갤탭 가로 1280',1280,800,1.5],['갤탭 세로 800',800,1280,1.5],['PC 1440',1440,900,1]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  await p.addInitScript(()=>{ const rej=function(){ return Promise.reject(new Error('blocked')); };
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:rej,configurable:true}); });
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.click('#tapstart');
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{
    const f=document.getElementById('btnFull').getBoundingClientRect();
    const x=document.getElementById('btnExit').getBoundingClientRect();
    const W=innerWidth,H=innerHeight;
    let ov=[];
    document.querySelectorAll('.hud-right,.plate,.quest,.menu-cluster .mbtn').forEach(e=>{
      const c=e.getBoundingClientRect(); if(c.width<2) return;
      [['full',f],['exit',x]].forEach(([nm2,q])=>{
        if(q.left<c.right-1&&q.right>c.left+1&&q.top<c.bottom-1&&q.bottom>c.top+1) ov.push(nm2+'/'+(e.id||e.className));
      });
    });
    return {overlapEach: f.right>x.left+1, inScreen: f.left>=0&&f.top>=-1&&x.right<=W+1&&x.bottom<=H+1,
            fw:Math.round(f.width), fh:Math.round(f.height), ov,
            hitFull:(function(){const el=document.elementFromPoint(f.left+f.width/2,f.top+f.height/2);
              return el?(el.id||el.className):'none';})()};
  });
  ok(`${nm}: ⛶ 와 ✕ 가 안 겹치고 화면 안에 있다`, !r.overlapEach && r.inScreen, JSON.stringify(r));
  ok(`${nm}: HUD 와도 안 겹친다`, r.ov.length===0, JSON.stringify(r.ov));
  ok(`${nm}: ⛶ 가 실제로 눌린다 (40px 이상)`, /btnFull/.test(r.hitFull) && r.fw>=40 && r.fh>=40,
     r.hitFull+' '+r.fw+'x'+r.fh);
  await ctx.close();
}
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
