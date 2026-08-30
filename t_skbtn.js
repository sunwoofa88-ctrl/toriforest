const {chromium}=require('playwright');
/* 스킬 버튼 실측 : 5해상도에서 실제 CSS px / 물리 px / 터치타겟 / 아이콘 비율 측정 */
const DEVS=[
  {n:'갤럭시탭A9+ 가로', w:1340, h:800,  dpr:1.5},
  {n:'갤럭시탭A9+ 세로', w:800,  h:1340, dpr:1.5},
  {n:'갤럭시 A9 폰',     w:393,  h:808,  dpr:2.75},
  {n:'작은폰 360',       w:640,  h:360,  dpr:3},
  {n:'PC 1280',          w:1280, h:720,  dpr:1},
];
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const rows=[];
  for(const d of DEVS){
    const p=await b.newPage({viewport:{width:d.w,height:d.h},deviceScaleFactor:d.dpr,isMobile:d.dpr>1,hasTouch:true});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
    await p.waitForTimeout(900);
    const m=await p.evaluate(()=>{
      const b0=document.getElementById('sk0');
      if(!b0) return null;
      const r=b0.getBoundingClientRect();
      const ic=b0.querySelector('.skic'), icr=ic?ic.getBoundingClientRect():null;
      const lv=b0.querySelector('.sklv'), lvr=lv?lv.getBoundingClientRect():null;
      const cs=getComputedStyle(b0);
      const b1=document.getElementById('sk1');
      const gap=b1? Math.round(b1.getBoundingClientRect().left - r.right) : -1;
      const cap=b0.parentNode.querySelector('.skn');
      const capr=cap?cap.getBoundingClientRect():null;
      // 캡션 잘림
      const capClip = cap? (cap.scrollWidth > cap.clientWidth+1) : false;
      return {
        w:+r.width.toFixed(1), h:+r.height.toFixed(1),
        radius:cs.borderRadius, border:cs.borderTopWidth,
        icW:icr?+icr.width.toFixed(1):0, icRatio: icr? +(icr.width/r.width).toFixed(3):0,
        lvW:lvr?+lvr.width.toFixed(1):0, lvH:lvr?+lvr.height.toFixed(1):0,
        gap, capW:capr?+capr.width.toFixed(1):0, capTxt:cap?cap.textContent:'', capClip,
        u:getComputedStyle(document.documentElement).getPropertyValue('--u').trim()
      };
    });
    rows.push({dev:d, m});
    await p.close();
  }
  await b.close();
  console.log('╔═══ 스킬 버튼 실측 ═══════════════════════════════════════════════');
  for(const r of rows){
    const m=r.m; if(!m){ console.log('  '+r.dev.n+' : 버튼 없음'); continue; }
    const phys=(m.w*r.dev.dpr).toFixed(0);
    const wcag = m.w>=44 && m.h>=44;
    const mat  = m.w>=48 && m.h>=48;
    console.log(`  ${r.dev.n.padEnd(18)} --u=${m.u.padEnd(6)} 버튼 ${String(m.w).padStart(5)}×${String(m.h).padEnd(5)}css (물리 ${phys}px)`);
    console.log(`     아이콘 ${m.icW}px (${(m.icRatio*100).toFixed(1)}%)  레벨뱃지 ${m.lvW}×${m.lvH}  버튼간격 ${m.gap}px  라운드 ${m.radius} 테두리 ${m.border}`);
    console.log(`     캡션 "${m.capTxt}" ${m.capW}px ${m.capClip?'❌잘림':'✅온전'}   WCAG44 ${wcag?'✅':'❌'}  Material48 ${mat?'✅':'❌'}`);
  }
  console.log('╚══════════════════════════════════════════════════════════════════');
})();
