const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
 await p.waitForTimeout(1000);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, P=T.P;
   const dirs=[[1,0],[-1,0],[0,1],[0,-1]], out=[];
   for(const [vx,vy] of dirs){
     const x0=P.x,y0=P.y,t0=performance.now();
     const iv=setInterval(()=>{P.vx=vx;P.vy=vy;},16);
     await new Promise(r=>setTimeout(r,700));
     clearInterval(iv); P.vx=0;P.vy=0;
     const dt=(performance.now()-t0)/1000;
     const d=Math.hypot(P.x-x0,P.y-y0);
     out.push(+(d/dt).toFixed(1));
     await new Promise(r=>setTimeout(r,120));
   }
   return {out, SC:T.dbg.dims? null:null, max:Math.max(...out)};
 });
 console.log('4방향 실측 px/s : '+r.out.join(' · ')+'   → 최대 '+r.max);
 await b.close();
})();
