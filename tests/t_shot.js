const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.beginPlay();});
 await p.waitForTimeout(1200);
 await p.evaluate(()=>{const T=window.__TORI; for(let i=0;i<5;i++) T.spawnEnemy(); T.doAttack();});
 await p.waitForTimeout(90);
 await p.screenshot({path:'/tmp/fxshot.png'});
 await b.close(); console.log('ok');
})();
