const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
 await p.waitForTimeout(1200);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, P=T.P;
   const x0=P.x, y0=P.y, t0=performance.now();
   P.vx=1; P.vy=0;
   const iv=setInterval(()=>{P.vx=1;P.vy=0;},16);
   await new Promise(r=>setTimeout(r,1500));
   clearInterval(iv);
   const dt=(performance.now()-t0)/1000;
   return {px:+( (P.x-x0)/dt ).toFixed(1), dt:+dt.toFixed(2)};
 });
 console.log('가로 이동 실측 속도  '+r.px+' px/s   ('+r.dt+'초 측정)');
 console.log('기대치 370 * SC · 벽에 막히면 낮게 나온다');
 await b.close();
})();
