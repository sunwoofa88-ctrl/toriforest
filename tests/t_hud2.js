const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
for(const [n,w,h,d] of [['태블릿세로',800,1280,2],['태블릿가로',1280,800,2],['PC',1440,900,1],['폰',412,846,3]]){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:w<900,hasTouch:w<900});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=12;T.S.acorn=18000;T.S.star=148;T.beginPlay();
    document.getElementById('moveHint').classList.add('gone');});
  await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const f=document.getElementById('frame').getBoundingClientRect();
    const hd=document.querySelector('.hud').getBoundingClientRect();
    const row=document.querySelector('.hud-row').getBoundingClientRect();
    const pl=document.querySelector('.plate').getBoundingClientRect();
    const q=document.querySelector('.quest').getBoundingClientRect();
    const rt=document.querySelector('.hud-right').getBoundingClientRect();
    const oneLine = Math.abs(pl.top-q.top)<6 && Math.abs(pl.top-rt.top)<24;
    return {hudH:Math.round(hd.height), pct:Math.round(hd.height/f.height*100),
      rowH:Math.round(row.height), oneLine,
      plW:Math.round(pl.width), qW:Math.round(q.width), rtW:Math.round(rt.width),
      used:Math.round((pl.width+q.width+rt.width)/f.width*100), fw:Math.round(f.width)};
  });
  console.log(n.padEnd(10)+' HUD '+String(r.hudH).padStart(4)+'px ('+String(r.pct).padStart(2)+'%)  한줄='+r.oneLine+
    '  덩어리폭 '+r.plW+'/'+r.qW+'/'+r.rtW+'  화면차지 '+r.used+'%');
  if(w===1280) await p.screenshot({path:'/root/toriforest/HUD2.png'});
  await p.close();
}
await b.close();})();
