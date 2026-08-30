/* 안내 화살표 · 시트 스크롤 유지 검증 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
const DEV=[['소형폰 320',320,568,2],['갤A9+ 393',393,808,2.75],['폰 가로 808',808,393,2.75],
           ['갤탭 가로 1280',1280,800,1.5],['갤탭 세로 800',800,1280,1.5],['PC 1440',1440,900,1]];
(async()=>{
const b=await chromium.launch();

console.log('\n[A] 화살표가 HUD·버튼에 안 가린다 (기기 6종 × 방향 12)');
for(const [nm,w,h,d] of DEV){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(500);
  const r = await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.prog={}; T.enterChapter(0);
    /* HUD·조작부의 실제 화면 영역 */
    const fb=document.getElementById('frame').getBoundingClientRect();
    const boxes=[];
    document.querySelectorAll('.hud, .dock, #btnAtk, #btnUlt, #btnInh, .menu-cluster .mbtn, .quest, .plate, .hud-right')
      .forEach(e=>{ const q=e.getBoundingClientRect();
        if(q.width>2&&q.height>2) boxes.push({l:q.left-fb.left,t:q.top-fb.top,r:q.right-fb.left,b:q.bottom-fb.top}); });
    /* 화살표가 그려질 위치를 12방향으로 계산 (실제 그리기 함수와 같은 식) */
    const W=T.__W||window.innerWidth, H=T.__H||window.innerHeight;
    const S=T.dbg.arrowSpot;
    const out=[];
    for(let i=0;i<12;i++){
      const a=i/12*6.2832;
      const spot=S(Math.cos(a)*4000, Math.sin(a)*4000);
      if(!spot) continue;
      const hit=boxes.some(q=> spot.x> q.l-14 && spot.x< q.r+14 && spot.y> q.t-14 && spot.y< q.b+14);
      out.push({a:Math.round(a*57), x:Math.round(spot.x), y:Math.round(spot.y), hit});
    }
    return {out, W, H, safe:T.dbg.uiSafe()};
  });
  const bad=r.out.filter(x=>x.hit);
  ok(`${nm}: 12방향 화살표가 전부 UI 밖`, bad.length===0,
     `겹침 ${bad.length}개 ` + JSON.stringify(bad.slice(0,3)) + ' safe='+JSON.stringify(r.safe));
  await p.close();
}

console.log('\n[B] 목표가 UI 뒤에 숨으면 화살표가 뜬다');
{
  const p=await b.newPage({viewport:{width:393,height:808},deviceScaleFactor:2.75,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(500);
  const r = await p.evaluate(()=>{
    const T=window.__TORI, S=T.dbg.arrowSpot;
    const sf=T.dbg.uiSafe();
    /* 화면 정중앙 → 화살표 없음 / HUD 한가운데(위) → 화살표 있어야 함 */
    return {
      center: S(0,0),                       /* 화면 중앙 : null 이어야 정상 */
      underHud: S(0, -(sf.H/2 - 12)),       /* HUD 뒤 */
      underDock: S(0, (sf.H/2 - 12))        /* 버튼 뒤 */
    };
  });
  ok('목표가 화면 한가운데면 화살표를 안 그린다', r.center===null, JSON.stringify(r.center));
  ok('목표가 HUD 뒤에 숨으면 화살표가 뜬다', r.underHud!==null, JSON.stringify(r.underHud));
  ok('목표가 조작버튼 뒤에 숨으면 화살표가 뜬다', r.underDock!==null, JSON.stringify(r.underDock));
  await p.close();
}

console.log('\n[C] 펫 조합 : 펫을 골라도 스크롤이 안 올라간다');
{
  const p=await b.newPage({viewport:{width:393,height:808},deviceScaleFactor:2.75,isMobile:true,hasTouch:true});
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(500);
  const r = await p.evaluate(async()=>{
    const T=window.__TORI;
    /* 펫을 여러 마리 준다 (목록이 길어야 스크롤이 생긴다) */
    T.S.pets={}; T.PET_IDS.slice(0,40).forEach(id=>T.S.pets[id]=3);
    T.S.petSlot=[]; T.rebuildPets();
    T.openSheet('pet',2);                    /* 펫 조합 탭 */
    await new Promise(r=>setTimeout(r,400));
    const body=document.getElementById('sheetBody');
    const max=body.scrollHeight-body.clientHeight;
    if(max<80) return {skip:1, max};
    body.scrollTop=Math.round(max*0.7);
    const before=body.scrollTop;
    /* 화면에 보이는 펫 카드 하나를 누른다 */
    const cards=[...body.querySelectorAll('.cell')].filter(c=>!c.classList.contains('locked'));
    const vis=cards.find(c=>{ const q=c.getBoundingClientRect(), bq=body.getBoundingClientRect();
      return q.top>bq.top+20 && q.bottom<bq.bottom-20; });
    if(!vis) return {skip:2, before, n:cards.length};
    vis.click();
    await new Promise(r=>setTimeout(r,350));
    const after=body.scrollTop;
    const sel=T.fuseUsable? 1 : 1;
    return {before:Math.round(before), after:Math.round(after), max:Math.round(max)};
  });
  ok('펫을 고른 뒤에도 보던 위치가 유지된다',
     r.skip || Math.abs(r.after-r.before)<=40, JSON.stringify(r));

  /* 장비 화면도 같은지 */
  const g = await p.evaluate(async()=>{
    const T=window.__TORI;
    T.EQ_IDS.slice(0,50).forEach(id=>{ T.S.eq[id]=1; });
    T.openSheet('gear',0);
    await new Promise(r=>setTimeout(r,400));
    const body=document.getElementById('sheetBody');
    const max=body.scrollHeight-body.clientHeight;
    if(max<80) return {skip:1};
    body.scrollTop=Math.round(max*0.6);
    const before=body.scrollTop;
    const cards=[...body.querySelectorAll('.cell')];
    const vis=cards.find(c=>{ const q=c.getBoundingClientRect(), bq=body.getBoundingClientRect();
      return q.top>bq.top+20 && q.bottom<bq.bottom-20; });
    if(!vis) return {skip:2};
    vis.click();
    await new Promise(r=>setTimeout(r,350));
    return {before:Math.round(before), after:Math.round(document.getElementById('sheetBody').scrollTop)};
  });
  ok('장비를 고른 뒤에도 보던 위치가 유지된다',
     g.skip || Math.abs(g.after-g.before)<=40, JSON.stringify(g));

  /* 탭을 바꾸면 맨 위로 가야 정상 */
  const tb = await p.evaluate(async()=>{
    const T=window.__TORI;
    T.openSheet('pet',2); await new Promise(r=>setTimeout(r,350));
    const body=document.getElementById('sheetBody');
    body.scrollTop=200;
    const tabs=document.querySelectorAll('#sheetTabs .tab');
    if(tabs.length<2) return {skip:1};
    tabs[0].click(); await new Promise(r=>setTimeout(r,350));
    return {after:document.getElementById('sheetBody').scrollTop};
  });
  ok('탭을 바꾸면 맨 위에서 시작한다', tb.skip || tb.after===0, JSON.stringify(tb));
  ok('스크롤 검증 중 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
  await p.close();
}

console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
