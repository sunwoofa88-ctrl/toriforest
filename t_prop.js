const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1000,height:760},deviceScaleFactor:2});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{
  const T=window.__TORI;
  const kinds=['hut','well','tent','lamp','torch','banner','fence','barrel','crate','mushroom','log','stump','chest','sign','fire','tree','bush','rock'];
  const cv=document.createElement('canvas'); cv.width=1000; cv.height=760;
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#7FB86A';
  document.body.appendChild(cv);
  const g=cv.getContext('2d');
  kinds.forEach((k,i)=>{
    const col=i%6, row=(i/6)|0;
    const s=T.SPR.prop[k]; if(!s) return;
    const src=s[0];
    const w=150, h=150*src.height/src.width;
    g.drawImage(src, col*166+8, row*250+240-h, w, h);
    g.font='bold 17px sans-serif'; g.fillStyle='#12240E'; g.textAlign='center';
    g.fillText(k, col*166+8+w/2, row*250+248);
  });
});
await p.waitForTimeout(400);
await p.screenshot({path:'PROPS.png'});
await b.close();})();
