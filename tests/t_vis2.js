const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:960,height:540},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
 await p.waitForTimeout(2200);
 await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<14;i++)T.spawnEnemy();});
 await p.waitForTimeout(800);
 // 무적 깜빡임 없이, 체력 가득한 상태로 고정
 const r=await p.evaluate(()=>{
   const T=window.__TORI; T.P.invT=0; T.P.dead=false;
   T.render();
   // 주인공 발밑 픽셀이 실제로 불투명한지 확인
   const cvs=document.querySelector('canvas'), g=cvs.getContext('2d');
   return {inv:T.P.invT, dpr:T.dbg.aqStat? 1:1};
 });
 await p.waitForTimeout(60);
 await p.screenshot({path:'/root/toriforest/shots/w1.png'});
 console.log('errors:',errs.length?errs.slice(0,3):'none');
 await b.close();
})();
