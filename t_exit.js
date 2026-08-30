/* 종료 버튼 검증 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();

console.log('\n[A] 위치 · 겹침 (기기 6종)');
for(const [nm,w,h,d] of [['소형폰 320',320,568,2],['갤A9+ 393',393,808,2.75],['폰 가로 808',808,393,2.75],
                          ['갤탭 가로 1280',1280,800,1.5],['갤탭 세로 800',800,1280,1.5],['PC 1440',1440,900,1]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const hidden = await p.evaluate(()=>document.getElementById('btnExit').classList.contains('hidden'));
  await p.click('#tapstart');
  await p.waitForTimeout(800);
  const r = await p.evaluate(()=>{
    const e=document.getElementById('btnExit'), q=e.getBoundingClientRect();
    const fb=document.getElementById('frame').getBoundingClientRect();
    const W=window.innerWidth, H=window.innerHeight;
    /* 다른 UI 와 겹치는지 */
    let ov=[];
    document.querySelectorAll('.hud-right, .plate, .quest, .menu-cluster .mbtn, .dock, #btnAtk').forEach(x=>{
      const c=x.getBoundingClientRect();
      if(c.width<2) return;
      if(q.left<c.right-1 && q.right>c.left+1 && q.top<c.bottom-1 && q.bottom>c.top+1)
        ov.push(x.id||x.className);
    });
    return { vis:getComputedStyle(e).display!=='none', w:Math.round(q.width), h:Math.round(q.height),
      fromRight:Math.round(fb.right-q.right), fromTop:Math.round(q.top-fb.top),
      inScreen: q.right<=W+1 && q.top>=-1 && q.left>=0 && q.bottom<=H+1,
      ov, hitTop: (function(){ const el=document.elementFromPoint(q.left+q.width/2, q.top+q.height/2);
        return el? (el.id||el.className) : 'none'; })() };
  });
  ok(`${nm}: 시작 화면에서는 종료 버튼이 숨겨져 있다`, hidden===true);
  ok(`${nm}: 게임 시작 후 오른쪽 위 구석에 보인다`,
     r.vis && r.inScreen && r.fromRight<=14 && r.fromTop<=14, JSON.stringify(r));
  ok(`${nm}: 다른 UI 와 겹치지 않는다`, r.ov.length===0, JSON.stringify(r.ov));
  ok(`${nm}: 실제로 눌리는 위치에 있다`, /btnExit/.test(r.hitTop), r.hitTop);
  ok(`${nm}: 터치 크기 40px 이상`, r.w>=40 && r.h>=40, r.w+'x'+r.h);
  await ctx.close();
}

console.log('\n[B] 동작 : 확인 팝업 → 저장 → 시작 화면');
{
  const ctx=await b.newContext({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.click('#tapstart');
  await p.waitForTimeout(900);
  await p.evaluate(()=>{ const T=window.__TORI; T.S.lv=33; T.S.chap=7; T.enterChapter(7); T.S.acorn=12345; });
  await p.waitForTimeout(400);

  /* 취소하면 그대로 게임이 이어져야 한다 */
  await p.click('#btnExit');
  await p.waitForTimeout(350);
  const hasBox = await p.evaluate(()=>document.querySelectorAll('.modal').length);
  ok('종료 버튼을 누르면 확인 팝업이 뜬다', hasBox===1, '팝업 '+hasBox+'개');
  await p.click('.mb-no');
  await p.waitForTimeout(500);
  const afterNo = await p.evaluate(()=>({modals:document.querySelectorAll('.modal').length,
    playing:window.__TORI.G.state, fs:!!document.fullscreenElement}));
  ok('"계속하기"를 누르면 게임이 그대로 이어진다',
     afterNo.modals===0 && afterNo.playing==='play' && afterNo.fs===true, JSON.stringify(afterNo));

  /* 끝내기 */
  await p.click('#btnExit');
  await p.waitForTimeout(350);
  await p.click('.mb-yes');
  await p.waitForTimeout(900);
  const afterYes = await p.evaluate(()=>({
    title: document.getElementById('tapstart').classList.contains('on'),
    exitHidden: document.getElementById('btnExit').classList.contains('hidden'),
    fs: !!document.fullscreenElement,
    state: window.__TORI.G.state,
    saved: (function(){ try{ const k=Object.keys(localStorage).find(x=>/tori/i.test(x));
      const o=JSON.parse(localStorage.getItem(k)); return {lv:o.lv, chap:o.chap, acorn:o.acorn}; }catch(e){ return null; } })()
  }));
  ok('"끝내기"를 누르면 시작 화면으로 돌아간다', afterYes.title===true, JSON.stringify(afterYes));
  ok('끝내면 전체화면에서도 빠져나온다', afterYes.fs===false, JSON.stringify(afterYes));
  ok('시작 화면에서는 종료 버튼이 다시 숨겨진다', afterYes.exitHidden===true);
  ok('끝내기 직전 진행이 저장된다',
     afterYes.saved && afterYes.saved.lv===33 && afterYes.saved.chap===7 && afterYes.saved.acorn===12345,
     JSON.stringify(afterYes.saved));

  /* 다시 시작하면 이어서 된다 */
  await p.click('#tapstart');
  await p.waitForTimeout(900);
  const again = await p.evaluate(()=>({state:window.__TORI.G.state, chap:window.__TORI.S.chap,
    lv:window.__TORI.S.lv, exitShown:!document.getElementById('btnExit').classList.contains('hidden'),
    fs:!!document.fullscreenElement}));
  ok('다시 시작하면 이어서 플레이된다',
     again.state==='play' && again.chap===7 && again.lv===33, JSON.stringify(again));
  ok('다시 시작하면 전체화면도 다시 된다', again.fs===true, JSON.stringify(again));
  ok('다시 시작하면 종료 버튼이 다시 보인다', again.exitShown===true);

  /* 연타해도 한 번만 */
  await p.click('#btnExit'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ const y=document.querySelector('.mb-yes'); y.click(); y.click(); y.click(); });
  await p.waitForTimeout(900);
  const spam = await p.evaluate(()=>({modals:document.querySelectorAll('.modal').length,
    title:document.getElementById('tapstart').classList.contains('on')}));
  ok('연타해도 팝업이 남지 않는다', spam.modals===0 && spam.title===true, JSON.stringify(spam));

  ok('종료 버튼 검증 중 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
  await ctx.close();
}
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
