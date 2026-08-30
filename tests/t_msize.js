const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=35;T.beginPlay();});
 await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>{
   const T=window.__TORI; for(let i=0;i<14;i++) T.spawnEnemy();
   const live=T.EN.filter(e=>e.alive);
   const norm=live.filter(e=>!e.boss&&!e.big).map(e=>e.size);
   const hero=T.P.size;
   const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
   return {n:norm.length, avg:+avg(norm).toFixed(1), min:Math.min(...norm), max:Math.max(...norm), hero:+hero.toFixed(1)};
 });
 console.log('일반 몬스터 크기  평균 '+r.avg+'px (최소 '+r.min+' 최대 '+r.max+') · 표본 '+r.n);
 console.log('주인공 크기       '+r.hero+'px   → 몬스터/주인공 비율 '+(r.avg/r.hero).toFixed(2));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
