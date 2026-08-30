/* GUI 전수 점검 : UI 가림 · 글자 잘림 · 시인성 (7~8세 기준) */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0; const issues=[];
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:'')); issues.push(n+' :: '+d);} }
const DEV=[['소형폰 320',320,568,2],['갤A9+폰 393',393,808,2.75],['폰가로 808',808,393,2.75],
  ['갤탭가로 1280',1280,800,1.5],['갤탭가로(바) 736',1280,736,1.5],['갤탭세로 800',800,1280,1.5],['PC 1440',1440,900,1]];
(async()=>{
const b=await chromium.launch();
for(const [nm,w,h,d] of DEV){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.click('#tapstart'); await p.waitForTimeout(900);
  await p.evaluate(()=>{ const T=window.__TORI; T.S.lv=45; T.S.acorn=987654321; T.S.star=99999;
    T.S.prog={}; T.enterChapter(44); });
  await p.waitForTimeout(700);

  /* ── ① UI 가림 : 화면에서 UI 가 덮는 비율 ── */
  const cover = await p.evaluate(()=>{
    const W=innerWidth,H=innerHeight, boxes=[];
    document.querySelectorAll('.hud, .dock, #btnFull, #btnExit, #toasts, .movehint').forEach(e=>{
      if(getComputedStyle(e).display==='none') return;
      const q=e.getBoundingClientRect(); if(q.width<2||q.height<2) return;
      /* 컨테이너가 pointer-events:none 이어도 '그림'은 가린다 → 실제 보이는 자식만 잰다 */
      const kids=e.querySelectorAll('*');
      const list = kids.length? [...kids].filter(k=>{
        const cs=getComputedStyle(k);
        if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return false;
        const r=k.getBoundingClientRect(); return r.width>2&&r.height>2 &&
          (cs.backgroundImage!=='none'||cs.backgroundColor!=='rgba(0, 0, 0, 0)'||k.tagName==='CANVAS'||k.tagName==='SVG');
      }) : [e];
      list.forEach(k=>{ const r=k.getBoundingClientRect(); boxes.push([r.left,r.top,r.right,r.bottom]); });
    });
    /* 격자 샘플링으로 덮인 면적 계산 */
    const N=60; let covered=0, tot=0;
    for(let iy=0;iy<N;iy++) for(let ix=0;ix<N;ix++){
      const x=(ix+0.5)/N*W, y=(iy+0.5)/N*H; tot++;
      if(boxes.some(q=>x>=q[0]&&x<=q[2]&&y>=q[1]&&y<=q[3])) covered++;
    }
    return {pct:+(covered/tot*100).toFixed(1)};
  });
  ok(`${nm}: UI 가림 22% 이하`, cover.pct<=22, cover.pct+'%');

  /* ── ② 몬스터·문·상자가 UI 뒤에 숨었을 때 화살표로 알려주는가 ── */
  const hidden = await p.evaluate(()=>{
    const T=window.__TORI, sf=T.dbg.uiSafe();
    /* 목표를 HUD 뒤·조작부 뒤에 두었을 때 화살표가 반드시 뜬다 */
    const a=T.dbg.arrowSpot(0, -(sf.H/2-14));
    const c=T.dbg.arrowSpot(0, (sf.H/2-14));
    const l=T.dbg.arrowSpot(-(sf.W/2-14), 0);
    const r=T.dbg.arrowSpot((sf.W/2-14), 0);
    return {top:!!a, bottom:!!c, left:!!l, right:!!r};
  });
  ok(`${nm}: 목표가 UI 뒤에 숨으면 4방향 모두 화살표가 뜬다`,
     hidden.top&&hidden.bottom&&hidden.left&&hidden.right, JSON.stringify(hidden));

  /* ── ③ 글자 잘림 전수 (게임 화면) ── */
  async function textScan(where){
    return await p.evaluate((where)=>{
      const bad=[];
      document.querySelectorAll('body *').forEach(e=>{
        const cs=getComputedStyle(e);
        if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return;
        const r=e.getBoundingClientRect();
        if(r.width<2||r.height<2) return;
        if(!e.childNodes.length) return;
        let hasText=false;
        e.childNodes.forEach(n=>{ if(n.nodeType===3 && n.textContent.trim()) hasText=true; });
        if(!hasText) return;
        const t=e.textContent.trim().slice(0,24);
        /* 가로 잘림 */
        if(e.scrollWidth > e.clientWidth+1 && cs.overflowX!=='visible')
          bad.push({where, t, kind:'가로잘림', sw:e.scrollWidth, cw:e.clientWidth});
        /* 세로 잘림 */
        else if(e.scrollHeight > e.clientHeight+2 && cs.overflowY==='hidden')
          bad.push({where, t, kind:'세로잘림', sh:e.scrollHeight, ch:e.clientHeight});
        /* 말줄임(...) 처리되어 실제로 글자가 안 보이는 경우 */
        else if(cs.textOverflow==='ellipsis' && e.scrollWidth>e.clientWidth+1)
          bad.push({where, t, kind:'말줄임', sw:e.scrollWidth, cw:e.clientWidth});
        /* 화면 밖 : 스크롤 목록 안에서 아래로 내려가 있는 건 정상이므로 제외한다.
           '가로'로 삐져나가거나, 스크롤 컨테이너 밖으로 나간 것만 문제로 센다. */
        var sc=e.closest('#sheetBody');
        if(sc){
          var sr=sc.getBoundingClientRect();
          if(r.right>sr.right+1||r.left<sr.left-1)
            bad.push({where, t, kind:'가로삐져나감', r:[Math.round(r.left),Math.round(r.right)],
                      box:[Math.round(sr.left),Math.round(sr.right)]});
        } else {
          if(r.right>innerWidth+1||r.left<-1||r.bottom>innerHeight+1||r.top<-1)
            bad.push({where, t, kind:'화면밖', r:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]});
        }
        /* 너무 작은 글씨 */
        const fs=parseFloat(cs.fontSize);
        if(fs>0 && fs<11) bad.push({where, t, kind:'작은글씨', fs:fs.toFixed(1)});
      });
      return bad;
    }, where);
  }
  let allBad = await textScan('게임화면');
  /* 모든 시트를 열어 가며 검사 */
  for(const [sk,tabs] of [['bag',3],['gear',2],['pet',3],['make',3],['book',3],['map',1]]){
    for(let tb=0;tb<tabs;tb++){
      await p.evaluate(([k,t])=>{ const T=window.__TORI;
        T.S.pets={}; T.PET_IDS.slice(0,24).forEach(i=>T.S.pets[i]=3);
        T.EQ_IDS.slice(0,24).forEach(i=>{T.S.eq[i]=1;});
        T.MAT_IDS.forEach(i=>{T.S.mat[i]=7;});
        T.openSheet(k,t); }, [sk,tb]);
      await p.waitForTimeout(320);
      allBad = allBad.concat(await textScan(sk+'#'+tb));
      await p.evaluate(()=>window.__TORI.closeSheet());
      await p.waitForTimeout(260);
    }
  }
  const uniq=[]; const seen=new Set();
  allBad.forEach(x=>{ const k=x.where+'|'+x.kind+'|'+x.t; if(!seen.has(k)){seen.add(k); uniq.push(x);} });
  ok(`${nm}: 글자 잘림·화면밖·작은글씨 0건`, uniq.length===0,
     uniq.length+'건 '+JSON.stringify(uniq.slice(0,5)));
  ok(`${nm}: 콘솔 오류 없음`, p.__errs.length===0, p.__errs.slice(0,2).join(' | '));
  await ctx.close();
}
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
if(issues.length){ console.log('\n[문제 목록]'); issues.forEach(x=>console.log(' - '+x.slice(0,300))); }
await b.close();
process.exit(fail?1:0);
})();
