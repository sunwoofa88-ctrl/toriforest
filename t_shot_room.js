const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{
    const T=window.__TORI;
    T.beginPlay(); T.enterChapter(0);
    const pg=T.prog(); pg.kills=0; T.applyProgress();
    T.P.x=T.WD.spawn.x; T.P.y=T.WD.spawn.y;
    T.cam.x=T.P.x; T.cam.y=T.P.y;
  });
  await p.waitForTimeout(300);
  await p.screenshot({path:'/tmp/room_spawn.png'});
  await p.evaluate(()=>{ const b=document.querySelector('[data-act="map"], .btnMap, #btnMap'); if(b) b.click(); });
  await p.waitForTimeout(200);
  await p.screenshot({path:'/tmp/room_map.png'});
  await b.close();
  console.log('저장 완료');
})();
