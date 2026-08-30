const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=200;T.beginPlay();});
  await p.waitForTimeout(1200);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI;
    const need=T.chapKillNeed? T.chapKillNeed(T.S.chap) : -1;
    // 스폰 횟수 세기
    let spawned=0;
    const orig=T.spawnEnemy;
    // 40초 동안 계속 즉사시키며 관찰
    const t0=Date.now(); let killed=0, maxAlive=0;
    while(Date.now()-t0 < 25000){
      await new Promise(r=>setTimeout(r,60));
      const EN=T.EN||[];
      let alive=0;
      for(const e of EN){ if(e.alive&&!e.dead){ alive++;
        if(!e.boss){ T.hurtEnemy(e, 1e9, 0, 0); killed++; } } }
      if(alive>maxAlive) maxAlive=alive;
    }
    const pg=T.prog? T.prog() : null;
    return {need, killed, maxAlive, kills:pg?pg.kills:-1, quotaMet:pg?!!pg.qm:null, boss:pg?!!pg.boss:null};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
