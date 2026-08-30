const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:3,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();});
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{
  const out=[];
  const hd=document.querySelector('.hud');
  const b=hd.getBoundingClientRect();
  ['.hud-row','.plate','.quest','.hud-right','.hud-row2','.menu-cluster','.mbtn'].forEach(s=>{
    const e=document.querySelector(s); if(!e) return;
    const q=e.getBoundingClientRect();
    out.push(s+' h='+Math.round(q.height)+' top='+Math.round(q.top-b.top)+' w='+Math.round(q.width));
  });
  const cs=getComputedStyle(hd);
  return {total:Math.round(b.height), pad:cs.paddingTop, items:out};
});
console.log('HUD 총 '+r.total+'px  위패딩 '+r.pad);
r.items.forEach(x=>console.log('  '+x));
await b.close();})();
