const {chromium}=require('playwright');
async function run(f){
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 await p.goto('file://'+f);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
 await p.waitForTimeout(1000);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, P=T.P, S=T.dbg.solidAt, D=T.dbg.dims();
   /* 오른쪽으로 500px 이 완전히 뚫린 지점을 찾아 거기서만 잰다 — 두 빌드가 같은 조건이 된다 */
   let spot=null;
   for(let gy=2; gy<D.ROWS-2 && !spot; gy+=2)
     for(let gx=2; gx<D.COLS-14; gx+=2){
       const x=gx*D.TS+D.TS/2, y=gy*D.TS+D.TS/2;
       let ok=true;
       for(let d=0; d<=520; d+=20) if(S(x+d,y)){ ok=false; break; }
       if(ok){ spot=[x,y]; break; }
     }
   if(!spot) return {err:'no open spot'};
   P.x=spot[0]; P.y=spot[1]; P.vx=0; P.vy=0;
   await new Promise(r=>setTimeout(r,140));
   const x0=P.x, t0=performance.now();
   const iv=setInterval(()=>{P.vx=1;P.vy=0;},16);
   await new Promise(r=>setTimeout(r,900));
   clearInterval(iv); P.vx=0;
   const dt=(performance.now()-t0)/1000;
   return {v:+((P.x-x0)/dt).toFixed(1), spot:spot.map(Math.round)};
 });
 await b.close(); return r;
}
(async()=>{
 const o=await run('/tmp/old.html'), n=await run('/tmp/new.html');
 console.log('이전(462) '+JSON.stringify(o));
 console.log('현재(370) '+JSON.stringify(n));
 if(o.v&&n.v) console.log('비율 '+(n.v/o.v).toFixed(3)+'   (목표 0.800)');
})();
