const {chromium}=require('playwright');
const DEVS=[
  {n:'A9+ 가로 1280x800', w:1280, h:800,  dpr:1.5, mm:0.12343},
  {n:'A9+ 세로 800x1280', w:800,  h:1280, dpr:1.5, mm:0.12343},
  {n:'폰 가로 720x360',   w:720,  h:360,  dpr:3,   mm:0.0631},
  {n:'폰 세로 393x808',   w:393,  h:808,  dpr:2.75,mm:0.0648},
  {n:'PC 1280x720',       w:1280, h:720,  dpr:1,   mm:0.2646},
];
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  for(const d of DEVS){
    const p=await b.newPage({viewport:{width:d.w,height:d.h},deviceScaleFactor:d.dpr,isMobile:d.dpr>1,hasTouch:true});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
    await p.waitForTimeout(900);
    const m=await p.evaluate(()=>{
      const g=el=>{const r=el.getBoundingClientRect();return{w:+r.width.toFixed(1),h:+r.height.toFixed(1),l:+r.left.toFixed(1),r:+r.right.toFixed(1),t:+r.top.toFixed(1),b:+r.bottom.toFixed(1)};};
      const cl=document.querySelector('.skill-cluster');
      const dk=document.querySelector('.dock');
      const sk=document.getElementById('sk0');
      const atk=document.getElementById('btnAtk');
      const inh=document.getElementById('btnInhale');
      const caps=[...document.querySelectorAll('.skill-row .skn')].map(c=>({t:c.textContent, clip:c.scrollWidth>c.clientWidth+1, w:Math.round(c.getBoundingClientRect().width)}));
      return {cluster:g(cl), dock:g(dk), sk:g(sk), atk:g(atk), inh:g(inh), caps, W:innerWidth, H:innerHeight,
        u:getComputedStyle(document.documentElement).getPropertyValue('--u').trim()};
    });
    const mm=x=>(x*d.dpr*d.mm).toFixed(1);
    console.log(`\n■ ${d.n}  --u=${m.u}  화면 ${m.W}×${m.H}`);
    console.log(`   스킬버튼 ${m.sk.w}×${m.sk.h}css = ${mm(m.sk.w)}mm   (어린이6-8세 권장 20mm / 어른최소 10mm)`);
    console.log(`   공격버튼 ${m.atk.w}css = ${mm(m.atk.w)}mm    볼주머니 ${m.inh.w}css = ${mm(m.inh.w)}mm`);
    console.log(`   스킬묶음 폭 ${m.cluster.w}css = 화면의 ${(m.cluster.w/m.W*100).toFixed(1)}%   좌${m.cluster.l} 우${m.cluster.r}`);
    console.log(`   남는 가로공간 ${(m.W-m.cluster.w).toFixed(0)}css`);
    const clipped=m.caps.filter(c=>c.clip);
    console.log(`   캡션 잘림 ${clipped.length}개 ${clipped.length?JSON.stringify(clipped):''}`);
    await p.close();
  }
  await b.close();
})();
