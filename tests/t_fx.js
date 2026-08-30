/* 공격 이펙트의 실제 크기·채움면적 측정 (A9+ 가로 1340x800 기준) */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.beginPlay();});
 await p.waitForTimeout(1200);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI;
   let maxSize=0, maxFill=0, frames=0, sumFill=0, maxN=0;
   const t0=performance.now();
   const iv=setInterval(()=>{ T.doAttack(); }, 90);
   const sample=()=>{
     const PT=T.PT; let fill=0, n=0, mx=0;
     for(const q of PT){ if(!q.alive) continue; n++; fill+=q.size*q.size; if(q.size>mx) mx=q.size; }
     if(mx>maxSize) maxSize=mx;
     if(fill>maxFill) maxFill=fill;
     if(n>maxN) maxN=n;
     sumFill+=fill; frames++;
   };
   const si=setInterval(sample, 16);
   await new Promise(r=>setTimeout(r, 4000));
   clearInterval(iv); clearInterval(si);
   const scr=innerWidth*innerHeight;
   return {maxSize:Math.round(maxSize), maxFillX:+(maxFill/scr).toFixed(2),
           avgFillX:+(sumFill/frames/scr).toFixed(2), maxN, frames};
 });
 console.log('공격 연타 4초 (A9+ 가로 1340x800)');
 console.log('  가장 큰 이펙트 한 변      '+r.maxSize+'px   (화면 높이 800 대비 '+Math.round(r.maxSize/800*100)+'%)');
 console.log('  파티클 채움면적 최대      화면의 '+r.maxFillX+'배');
 console.log('  파티클 채움면적 평균      화면의 '+r.avgFillX+'배');
 console.log('  동시 파티클 최대          '+r.maxN+'개');
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
