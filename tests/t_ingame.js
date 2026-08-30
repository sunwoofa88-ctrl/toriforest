const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI,S=T.S;T.S.lv=45;T.beginPlay();
   const want={}; for(const id of T.EQ_IDS){const E=T.EQUIP[id]; if(!E)continue;
     if(E.slot===1){const t=T.ARM_TYPE[E.tn]; if(t&&t.id==='plate'&&!want[1])want[1]=id;}
     if(E.slot===0){const t=T.WEP_TYPE[E.tn]; if(t&&t.id==='sword'&&!want[0])want[0]=id;} }
   for(const sl in want) T.giveEquip(want[sl]);
   S.eqOn={a:want[1], w:want[0]}; S.eqA=want[1]; S.eqW=want[0]; T.refreshHeroArt();});
 await p.waitForTimeout(900);
 await p.evaluate(()=>{const T=window.__TORI; for(let i=0;i<6;i++) T.spawnEnemy();});
 await p.waitForTimeout(700);
 await p.evaluate(()=>{const t=document.getElementById('tapstart'); if(t)t.classList.remove('on');
   document.body.classList.remove('titleon');
   const T=window.__TORI; T.P.x+=0; T.render&&T.render();});
 await p.waitForTimeout(400);
 await p.evaluate(()=>window.__TORI.doAttack());
 await p.waitForTimeout(90);
 await p.screenshot({path:'/tmp/ingame.png'});
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
