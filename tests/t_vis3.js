const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:960,height:540},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();
   window.__iv=setInterval(()=>{T.P.invT=0;},16);});     // 깜빡임만 끈다 (render 호출 X)
 await p.waitForTimeout(2400);
 await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<12;i++)T.spawnEnemy();});
 await p.waitForTimeout(900);
 await p.screenshot({path:'/root/toriforest/shots/w2.png'});
 const st=await p.evaluate(()=>{const T=window.__TORI;
   return {hp:T.dbg.hpRatio(), inv:T.P.invT, en:T.EN.filter(e=>e.alive&&!e.dead).length,
           q:T.dbg.aqStat(), dpr:T.dbg.aqStat().atkFxs};});
 console.log('errors:',errs.length?errs.slice(0,3):'none','|',JSON.stringify(st.q));
 await b.close();
})();
