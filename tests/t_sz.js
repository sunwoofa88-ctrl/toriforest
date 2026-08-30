const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
for(const w of [320,360,393,412,480]){
  const p=await b.newPage({viewport:{width:w,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();});
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const bs=[...document.querySelectorAll('.menu-cluster .mbtn')].map(e=>e.getBoundingClientRect());
    const q=document.querySelector('.quest').getBoundingClientRect();
    const fs=getComputedStyle(document.querySelector('.mbtn span')).fontSize;
    return {n:bs.length, w:Math.round(bs[0].width), h:Math.round(bs[0].height), q:Math.round(q.width), fs};
  });
  console.log(w+'px → 버튼 '+r.n+'개  '+r.w+'x'+r.h+'  글자 '+r.fs+'  퀘스트폭 '+r.q);
  await p.close();
}
await b.close();})();
