const {chromium}=require('playwright');
async function run(f){
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 await p.goto('file://'+f);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
 await p.waitForTimeout(1000);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, P=T.P, S=T.dbg.solidAt;
   /* 장애물이 없는 방향을 먼저 확인하고, 그 방향으로 짧게만 움직여 순수 속도를 잰다 */
   const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
   let best=0;
   for(const [vx,vy] of dirs){
     let clear=true;
     for(let d=20; d<=260; d+=20){ if(S(P.x+vx*d, P.y+vy*d)){ clear=false; break; } }
     if(!clear) continue;
     const x0=P.x,y0=P.y,t0=performance.now();
     const iv=setInterval(()=>{P.vx=vx;P.vy=vy;},16);
     await new Promise(r=>setTimeout(r,420));
     clearInterval(iv); P.vx=0;P.vy=0;
     const dt=(performance.now()-t0)/1000;
     const v=Math.hypot(P.x-x0,P.y-y0)/dt;
     if(v>best) best=v;
     P.x=x0; P.y=y0;
     await new Promise(r=>setTimeout(r,80));
   }
   return +best.toFixed(1);
 });
 await b.close(); return r;
}
(async()=>{
 const o=await run('/tmp/old.html'), n=await run('/tmp/new.html');
 console.log('이전(462) '+o+' px/s → 현재(370) '+n+' px/s   비율 '+(n/o).toFixed(3)+'  (목표 0.800)');
})();
