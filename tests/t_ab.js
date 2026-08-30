const {chromium}=require('playwright');
async function run(f){
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 await p.goto('file://'+f);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
 await p.waitForTimeout(1000);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, P=T.P; const dirs=[[1,0],[-1,0],[0,1],[0,-1]]; let mx=0;
   for(const [vx,vy] of dirs){
     P.x=T.P.x; const x0=P.x,y0=P.y,t0=performance.now();
     const iv=setInterval(()=>{P.vx=vx;P.vy=vy;},16);
     await new Promise(r=>setTimeout(r,600));
     clearInterval(iv); P.vx=0;P.vy=0;
     const dt=(performance.now()-t0)/1000;
     mx=Math.max(mx, Math.hypot(P.x-x0,P.y-y0)/dt);
     await new Promise(r=>setTimeout(r,100));
   }
   return +mx.toFixed(1);
 });
 await b.close(); return r;
}
(async()=>{
 const o=await run('/tmp/old.html'), n=await run('/tmp/new.html');
 console.log('이전(462) '+o+' px/s → 현재(370) '+n+' px/s   비율 '+(n/o).toFixed(3)+'  (목표 0.800)');
})();
