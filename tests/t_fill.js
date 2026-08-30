/* 가설검증: 이 시험환경의 프레임은 '픽셀 수'에 비례하는가 (=소프트웨어 래스터라이저 한계인가) */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 for(const [w,h,d] of [[1024,576,1.0],[1024,576,1.5],[1024,576,2.0],[720,405,1.5]]){
   const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d});
   await p.goto(F);
   await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
   await p.evaluate(()=>window.__TORI.beginPlay());
   await p.waitForTimeout(1500);
   const r=await p.evaluate(()=>new Promise(res=>{
     const T=window.__TORI; T.dbg.setRoam(0); for(const e of T.EN) e.alive=false;
     let n=0,t0=performance.now(),last=t0,fr=[];
     function tick(){ const t=performance.now(); fr.push(t-last); last=t; n++;
       if(t-t0<4000) requestAnimationFrame(tick);
       else{ fr.sort((a,b)=>a-b);
         const cv=document.querySelector('canvas');
         res({fps:Math.round(n/((t-t0)/1000)), p50:+fr[fr.length>>1].toFixed(1),
              px:cv.width*cv.height, cw:cv.width, ch:cv.height,
              hp:T.P.hp, maxHp:T.dbg.maxHp(), q:(window.__TORI.dbg.aqStat().soft>0?1:0)}); }
     } requestAnimationFrame(tick);
   }));
   console.log(`viewport ${w}x${h} dpr${d} → canvas ${r.cw}x${r.ch} (${(r.px/1e6).toFixed(2)}M px)  p50=${r.p50}ms  fps=${r.fps}  → ${(r.p50/(r.px/1e6)).toFixed(1)} ms/Mpx   [P.hp=${r.hp}/${r.maxHp}]`);
   await p.close();
 }
 await b.close();
})();
