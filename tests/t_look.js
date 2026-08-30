const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:960,height:600},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();
   window.__iv=setInterval(()=>{T.P.invT=0;},16);});
 await p.waitForTimeout(2600);
 await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<14;i++)T.spawnEnemy();});
 await p.waitForTimeout(1100);
 await p.screenshot({path:'/root/concept/game_lit.png'});
 console.log('오류:',errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
