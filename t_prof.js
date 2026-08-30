const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:800,height:1280},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
await p.waitForTimeout(1200);
// 렌더 단계별 시간 측정 (실제 render() 안에서 걸리는 시간)
const r=await p.evaluate(()=>new Promise(res=>{
  const T=window.__TORI;
  // 캔버스 컨텍스트를 감싸서 drawImage/fill 호출 수와 픽셀량을 센다
  const cv=document.querySelector('canvas');
  const ctx=cv.getContext('2d');
  const stats={drawImage:0, diPixels:0, fill:0, fillRect:0, stroke:0, calls:0};
  const od=ctx.drawImage.bind(ctx), of=ctx.fill.bind(ctx), ofr=ctx.fillRect.bind(ctx), os=ctx.stroke.bind(ctx);
  ctx.drawImage=function(){ stats.drawImage++; stats.calls++;
    const a=arguments;
    if(a.length===9) stats.diPixels+=Math.abs(a[7]*a[8]);
    else if(a.length===5) stats.diPixels+=Math.abs(a[3]*a[4]);
    else if(a[0]&&a[0].width) stats.diPixels+=a[0].width*a[0].height;
    return od.apply(null,a); };
  ctx.fill=function(){ stats.fill++; stats.calls++; return of.apply(null,arguments); };
  ctx.fillRect=function(){ stats.fillRect++; stats.calls++; return ofr.apply(null,arguments); };
  ctx.stroke=function(){ stats.stroke++; stats.calls++; return os.apply(null,arguments); };
  let frames=0; const t0=performance.now();
  function tick(){ frames++; if(performance.now()-t0<2000) requestAnimationFrame(tick);
    else { const s={}; for(const k in stats) s[k]=Math.round(stats[k]/frames);
      s.frames=frames; s.fps=+(frames/((performance.now()-t0)/1000)).toFixed(1);
      s.diMpxPerFrame=+(stats.diPixels/frames/1e6).toFixed(2);
      ctx.drawImage=od; ctx.fill=of; ctx.fillRect=ofr; ctx.stroke=os;
      res(s); } }
  requestAnimationFrame(tick);
}));
console.log('태블릿 800x1280 프레임당 그리기 통계:');
console.log(JSON.stringify(r,null,1));
const info=await p.evaluate(()=>{
  const cv=document.querySelector('canvas');
  return {backbuffer:cv.width+'x'+cv.height, px:+(cv.width*cv.height/1e6).toFixed(2),
    dpr:window.__TORI.dpr, q:window.__TORI.quality};
});
console.log(JSON.stringify(info));
await b.close();})();
