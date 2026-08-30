const {chromium}=require('playwright');
const CASES=[['폰 세로 S22+',412,915,2.6],['폰 세로 작은',360,740,3],['A9+ 세로',800,1280,1.5],['A9+ 가로',1280,800,1.5]];
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 for(const [nm,w,h,d] of CASES){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI;
    const R=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return{h:Math.round(b.height),w:Math.round(b.width)};};
    const dock=R('.dock'), hud=document.querySelector('.hud');
    const caps=[...document.querySelectorAll('b.skill-cap')];
    const trunc=caps.filter(e=>e.scrollWidth>e.clientWidth+1).length;
    const gap=Math.round(Math.min(...caps.map(e=>innerHeight-e.getBoundingClientRect().bottom)));
    T.openSheet('gear'); await new Promise(r=>setTimeout(r,350));
    const hd=R('.sheet-hd'),tb=R('.tabs'),bd=R('.sheet-bd'),ft=R('.sheet-foot');
    T.closeSheet();
    return {W:innerWidth,H:innerHeight,u:getComputedStyle(document.documentElement).getPropertyValue('--u').trim(),
      dockH:dock&&dock.h, capTrunc:trunc, capGap:gap,
      shell:(hd?hd.h:0)+(tb?tb.h:0)+(ft?ft.h:0), body:bd&&bd.h,
      canvas:(()=>{const c=document.querySelector('canvas');return c.width+'x'+c.height;})()};
  });
  console.log(`■ ${nm.padEnd(12)} ${r.W}×${r.H} u=${r.u}  조작부 ${r.dockH}px  시트껍데기 ${r.shell}px(${(100*r.shell/r.H).toFixed(0)}%) 내용 ${r.body}px  글자잘림 ${r.capTrunc} 아래여백 ${r.capGap}  캔버스 ${r.canvas}`);
  await p.close();
 }
 await b.close();
})();
