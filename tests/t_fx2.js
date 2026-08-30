const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.beginPlay();});
 await p.waitForTimeout(1200);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI;
   for(let i=0;i<10;i++) T.spawnEnemy();
   let maxSize=0,maxFill=0,sum=0,f=0;
   const si=setInterval(()=>{ let fill=0,mx=0;
     for(const q of T.PT){ if(!q.alive) continue; fill+=q.size*q.size; if(q.size>mx)mx=q.size; }
     if(mx>maxSize)maxSize=mx; if(fill>maxFill)maxFill=fill; sum+=fill; f++; },16);
   const ai=setInterval(()=>T.doAttack(),90);
   const ui=setInterval(()=>{ try{T.S.ult=999; T.doUlt();}catch(e){} }, 900);
   await new Promise(r=>setTimeout(r,5000));
   clearInterval(si);clearInterval(ai);clearInterval(ui);
   const scr=innerWidth*innerHeight;
   return {maxSize:Math.round(maxSize), maxFillX:+(maxFill/scr).toFixed(2), avgFillX:+(sum/f/scr).toFixed(2)};
 });
 console.log('공격+필살기 연타 5초 (적 10마리)');
 console.log('  가장 큰 이펙트 한 변  '+r.maxSize+'px  (화면높이 800 대비 '+Math.round(r.maxSize/800*100)+'%)');
 console.log('  채움면적 최대/평균    화면의 '+r.maxFillX+'배 / '+r.avgFillX+'배');
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
