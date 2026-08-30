const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
for(const w of [320,393,412]){
  const p=await b.newPage({viewport:{width:w,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.S.acorn=9999999;T.beginPlay();});
  await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const h=document.querySelector('.hud').getBoundingClientRect();
    const bs=[...document.querySelectorAll('.mbtn')].map(e=>e.getBoundingClientRect());
    const q=document.querySelector('.quest').getBoundingClientRect();
    const zn=document.getElementById('uiZone'), st=document.getElementById('uiStage');
    return {hud:Math.round(h.height), pct:Math.round(h.height/innerHeight*100),
      btn:Math.round(bs[0].width)+'x'+Math.round(bs[0].height),
      qH:Math.round(q.height),
      clip:(zn.scrollWidth>zn.clientWidth+2)||(st.scrollWidth>st.clientWidth+2)};
  });
  console.log(w+'px → HUD '+r.hud+'px ('+r.pct+'%)  메뉴버튼 '+r.btn+'  목표줄 '+r.qH+'px  글자잘림 '+r.clip);
  if(w===412) await p.screenshot({path:'/root/toriforest/HUD.png'});
  await p.close();
}
await b.close();})();
