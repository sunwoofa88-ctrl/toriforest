const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const info = await p.evaluate(()=>{
    const T=window.__TORI;
    T.beginPlay(); T.enterChapter(0);
    const pg=T.prog(); pg.kills=0; T.applyProgress();
    const WD=T.WD;
    return {gate1:WD.gate1, gate2:WD.gate2, exitGate:{x:WD.exitGate.x,y:WD.exitGate.y,open:WD.exitGate.open},
      camps:WD.camps.map(c=>({x:c.x,y:c.y,mob:c.mob})), arena:WD.arena, spawn:WD.spawn};
  });
  console.log(JSON.stringify(info,null,1));
  await b.close();
})();
