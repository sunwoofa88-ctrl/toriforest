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
 await p.waitForTimeout(900);
 await p.screenshot({path:'/root/toriforest/shots/v1.png'});
 await p.evaluate(()=>{const T=window.__TORI;let g=null,d=1e9;
   for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
   if(g)T.doAttack(g.x,g.y-g.size*0.5);});
 await p.waitForTimeout(90);
 await p.screenshot({path:'/root/toriforest/shots/v2.png'});
 // 전리품·그림자 확인용 : 아이템 뿌리기
 await p.evaluate(()=>{const T=window.__TORI; for(let i=0;i<8;i++) T.dropLoot&&T.dropLoot(T.P.x+(Math.random()-0.5)*300,T.P.y+(Math.random()-0.5)*200);});
 await p.waitForTimeout(700);
 await p.screenshot({path:'/root/toriforest/shots/v3.png'});
 console.log('errors:',errs.length?errs.slice(0,3):'none');
 await b.close();
})();
