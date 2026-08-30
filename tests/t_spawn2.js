const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=300;T.beginPlay();});
  await p.waitForTimeout(1200);
  for(const ch of [0,4,9,29,59]){
    const r=await p.evaluate(async(ch)=>{
      const T=window.__TORI;
      T.enterChapter(ch);
      await new Promise(r=>setTimeout(r,700));
      const need=T.chapKillNeed(T.S.chap);
      const t0=Date.now(); let killed=0, maxAlive=0, bossSeen=false;
      while(Date.now()-t0 < 14000){
        await new Promise(r=>setTimeout(r,60));
        let alive=0;
        for(const e of (T.EN||[])){ if(e.alive&&!e.dead){ alive++;
          if(e.boss) bossSeen=true;
          T.hurtEnemy(e, 1e9, 0, 0); killed++; } }
        if(alive>maxAlive) maxAlive=alive;
      }
      const pg=T.prog();
      return {ch, need, killed, maxAlive, kills:pg.kills, qm:!!pg.qm, boss:!!pg.boss, bossSeen};
    }, ch);
    const ok = r.killed <= r.need + 2;
    console.log(`${(ch+1+'장').padEnd(5)} 목표 ${String(r.need).padStart(2)} → 실제 생성 ${String(r.killed).padStart(3)}  동시최대 ${r.maxAlive}  쿼터달성 ${r.qm?'O':'X'} 보스 ${r.bossSeen?'O':'X'}  ${ok?'✅':'❌ 초과'}`);
  }
  await b.close();
})();
