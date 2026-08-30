const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:640},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{ const T=window.__TORI; T.S.lv=60; T.beginPlay(); });
 await p.waitForTimeout(1200);
 for(const w of ['bow','staff','claw','boomer']){
   await p.evaluate(async(W)=>{
     const T=window.__TORI;
     const ids=Object.keys(T.EQUIP||{}).filter(k=>T.EQUIP[k].slot===0 && T.EQUIP[k].tn===W);
     if(ids.length){ T.S.eqOn=T.S.eqOn||{}; T.S.eqOn.w=ids[0]; T.S.eqW=ids[0]; }
     for(let i=0;i<6;i++) T.spawnEnemy();
   }, w);
   await p.waitForTimeout(400);
   await p.evaluate(()=>window.__TORI.doUlt());
   await p.waitForTimeout(450);
   await p.screenshot({path:'/root/toriforest/fx_'+w+'.png'});
 }
 await b.close(); console.log('ok');
})();
