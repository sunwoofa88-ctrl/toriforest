const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:760,height:300},deviceScaleFactor:2});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{
  const T=window.__TORI;
  const ks=['bush','tree','rock','mushroom','stump','log','slab','pillar','arch'];
  const cv=document.createElement('canvas'); cv.width=760; cv.height=300;
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#6FAE58';
  document.body.appendChild(cv); const g=cv.getContext('2d');
  ks.forEach((k,i)=>{ const s=T.SPR.prop[k]; if(!s)return;
    s.forEach((src,v)=>{
      const w=120,h=120*src.height/src.width;
      g.drawImage(src, i*82+4+(v?0:0), 230-h+(v?-100:0), w*0.62, h*0.62);
    });
    g.font='bold 13px sans-serif'; g.fillStyle='#12240E'; g.textAlign='center';
    g.fillText(k, i*82+42, 250);
  });
});
await p.waitForTimeout(300);
await p.screenshot({path:'CROP.png'});
await b.close();})();
