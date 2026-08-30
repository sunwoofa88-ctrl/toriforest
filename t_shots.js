const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.screenshot({path:'q_title.png'});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(2600);
  await p.screenshot({path:'q_play.png'});
  // 전투 장면
  for(let i=0;i<26;i++){
    await p.evaluate(()=>{const T=window.__TORI;let e=null;for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}}
      T.doAttack(e?e.x:T.P.x+150,e?e.y-e.size*0.5:T.P.y-60);});
    await p.waitForTimeout(85);
  }
  await p.screenshot({path:'q_combat.png'});
  // 보스전
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=14;T.S.abil='hammer';T.S.owned.hammer=1;T.spawnEnemy('b_bug',1);});
  await p.waitForTimeout(1200);
  for(let i=0;i<14;i++){ await p.evaluate(()=>{const T=window.__TORI;let e=null;for(const x of T.EN){if(x.alive&&!x.dead&&x.boss){e=x;break;}}
    if(e)T.doAttack(e.x,e.y-e.size*0.5);}); await p.waitForTimeout(90); }
  await p.screenshot({path:'q_boss.png'});
  // 필살기
  await p.evaluate(()=>{window.__TORI.S.ult=100;window.__TORI.doUlt();});
  await p.waitForTimeout(260);
  await p.screenshot({path:'q_ult.png'});
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
