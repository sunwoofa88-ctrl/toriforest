const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const info = await p.evaluate(()=>{
    const T=window.__TORI;
    T.beginPlay(); T.enterChapter(9);   // 9 = 첫 대장 보스 장 (9%10===9)
    const pg=T.prog();
    pg.kills=T.chapKillNeed(9); T.applyProgress();  // 쿼터 달성 → 아레나 문 열림
    return {chap:9, isBoss:T.chapIsBoss(9), arenaOpen:T.WD.arena?true:false,
      g1:T.WD.gate1.open, g2:T.WD.gate2.open, exitOpen:T.WD.exitGate.open};
  });
  console.log(JSON.stringify(info));
  await p.evaluate(()=>{ const b=document.querySelector('[data-act="map"], .btnMap, #btnMap'); if(b) b.click(); });
  await p.waitForTimeout(200);
  await p.screenshot({path:'/tmp/boss_map.png'});
  await b.close();
})();
