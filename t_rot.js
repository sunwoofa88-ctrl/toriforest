/* 회전 래스터화 비용 정밀 측정 — 루프정지 · 화질고정 · 마릿수고정 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch(['--disable-gpu-vsync']);
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  p.on('pageerror',e=>console.log('  ❌ '+e.message));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1200);
  const set=await p.evaluate(()=>window.__TORI.dbg.benchSetup(24));
  console.log('  고정 조건 :', JSON.stringify(set));

  const CASES=[
    ['정지·변환없음      (기울기0, 크기1)',        {rot:0,    sx:1,    sy:1}],
    ['스쿼시만          (기울기0, 1.06/0.94)',   {rot:0,    sx:1.06, sy:0.94}],
    ['기울기 0.15rad    (회전 래스터화)',         {rot:0.15, sx:1.06, sy:0.94}],
    ['기울기 0.03rad    (작은 회전)',            {rot:0.03, sx:1.06, sy:0.94}],
  ];
  const R={};
  for(let round=0;round<4;round++){
    for(const [lbl,o] of CASES){
      const ms=await p.evaluate(x=>window.__TORI.dbg.benchRender(x), Object.assign({frames:60},o));
      (R[lbl]=R[lbl]||[]).push(ms);
    }
  }
  console.log('\n── 프레임당 렌더 시간 (중앙값, 4회차) ──');
  const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
  const base=med(R[CASES[0][0]]);
  for(const [lbl] of CASES){
    const m=med(R[lbl]);
    console.log(`  ${lbl}  ${m.toFixed(2)}ms   (기준대비 ${(m-base>=0?'+':'')}${(m-base).toFixed(2)}ms)  [${R[lbl].join(', ')}]`);
  }
  await b.close();
})();
