/* 장시간 플레이 : 메모리 누수 · 상태 오염 · 풀 고갈을 찾는다 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1356,height:848},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts\.g/.test(m.text()))errs.push(m.text());});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1000);
  const snaps=[];
  for(let round=0; round<6; round++){
    await p.evaluate(async()=>{
      const T=window.__TORI;
      for(let i=0;i<160;i++){
        let t=null,bd=1e9;
        for(const e of T.EN){ if(!e.alive||e.dead)continue;
          const d=Math.hypot(e.x-T.P.x,e.y-T.P.y); if(d<bd){bd=d;t=e;} }
        if(t) T.doAttack(t.x,t.y-t.size*0.5);
        if(i%40===0){ T.S.ult=100; T.doUlt(); }
        await new Promise(r=>setTimeout(r,14));
      }
    });
    const s=await p.evaluate(()=>{
      const T=window.__TORI, m=performance.memory;
      let alivePR=0, alivePT=0;
      for(const q of T.dbg.PR) if(q.alive) alivePR++;
      return { 힙MB:+(m.usedJSHeapSize/1048576).toFixed(1),
               파티클:T.particleCount(), 발사체:alivePR,
               적:T.EN.filter(e=>e.alive&&!e.dead).length,
               장:T.S.chap, 레벨:T.S.lv,
               캐시:{ tint:T.dbg.aqStat? T.dbg.aqStat().n : -1 } };
    });
    snaps.push(s);
    console.log('라운드'+(round+1), JSON.stringify(s));
  }
  const h=snaps.map(s=>s.힙MB);
  console.log('\n힙 추이:', h.join(' → '), ' 증가', (h[h.length-1]-h[0]).toFixed(1)+'MB');
  console.log('오류:', errs.length, errs.slice(0,3));
  await b.close();
})();
