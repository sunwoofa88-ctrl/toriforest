// 던전 3방 구조 검증 — 8종 지형 × 여러 장(일반/중간보스/대장보스)에 대해
// 1) gate1/gate2/exitGate/arenaGate 가 전부 걸을 수 있는 타일 위에 있는지 (connectWorld 보장)
// 2) 누적 처치 수에 따라 문이 순서대로만 열리는지 (34%→67%→100%)
// 3) 잠긴 방의 캠프는 몬스터가 안 나오는지
// 4) objTarget() 이 잠긴 방을 가리키지 않는지
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;} else {fail++; console.log('  ❌ '+n+(d?'  → '+d:''));} }

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  p.on('pageerror',e=>{fail++;console.log('  ❌ pageerror:',e.message);});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});

  // 8종 지형이 나오는 장을 고른다 (chapTerrain 은 장 번호로 결정되므로 0~79장 훑어서 8종 각 1개 이상 확보)
  const picks = await p.evaluate(()=>{
    const T=window.__TORI;
    const seen={}; const out=[];
    for(let c=0;c<160;c++){
      const t=T.chapTerrain(c);
      if(seen[t]===undefined){ seen[t]=c; out.push(c); }
      if(out.length>=8) break;
    }
    for(let c=0;c<40;c++){ if(T.chapIsBoss(c)){ out.push(c); break; } }
    for(let c=0;c<40;c++){ if(T.chapIsMid(c)){ out.push(c); break; } }
    out.push(0);
    return [...new Set(out)];
  });
  console.log('검사 대상 장:', picks.join(','));

  for(const c of picks){
    const r = await p.evaluate((c)=>{
      const T=window.__TORI;
      T.enterChapter(c);
      const WD=T.WD;
      const out={c, terrain:T.chapTerrain(c), isBoss:T.chapIsBoss(c), isMid:T.chapIsMid(c)};
      out.gate1Walkable = T.walkTile(Math.floor(WD.gate1.x/T.TS),Math.floor(WD.gate1.y/T.TS));
      out.gate2Walkable = T.walkTile(Math.floor(WD.gate2.x/T.TS),Math.floor(WD.gate2.y/T.TS));
      out.exitWalkable  = T.walkTile(Math.floor(WD.exitGate.x/T.TS),Math.floor(WD.exitGate.y/T.TS));
      const pg=T.prog(); pg.kills=0; T.applyProgress();
      out.initG1=WD.gate1.open; out.initG2=WD.gate2.open;
      out.n1=T.chapRoomNeed(c,1); out.n2=T.chapRoomNeed(c,2); out.n3=T.chapKillNeed(c);
      out.orderOk = out.n1 < out.n2 && out.n2 <= out.n3;
      pg.kills=out.n1; T.applyProgress();
      out.afterN1_g1=WD.gate1.open; out.afterN1_g2=WD.gate2.open;
      pg.kills=out.n2; T.applyProgress();
      out.afterN2_g1=WD.gate1.open; out.afterN2_g2=WD.gate2.open;
      pg.kills=0; T.applyProgress();
      T.clearEntities();
      for(let t=0;t<40;t++) T.updateCamps(1/30);
      out.campsAliveWhileLocked = WD.camps.map(cp=>cp.alive);
      const tg=T.objTarget();
      function same(a,b){ return a&&Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1; }
      out.targetsLockedCamp = tg && (same(tg,WD.camps[1])||same(tg,WD.camps[2]));
      return out;
    }, c);
    ok(`[c${c} t${r.terrain}] gate1 걷기가능`, r.gate1Walkable, JSON.stringify(r));
    ok(`[c${c}] gate2 걷기가능`, r.gate2Walkable);
    ok(`[c${c}] exitGate 걷기가능`, r.exitWalkable);
    ok(`[c${c}] 목표치 순서(n1<n2<=n3)`, r.orderOk, `n1=${r.n1} n2=${r.n2} n3=${r.n3}`);
    ok(`[c${c}] 초기 문1,2 잠김`, r.initG1===false && r.initG2===false);
    ok(`[c${c}] n1 채움→문1만 열림`, r.afterN1_g1===true && r.afterN1_g2===false, JSON.stringify(r));
    ok(`[c${c}] n2 채움→문1,2 다 열림`, r.afterN2_g1===true && r.afterN2_g2===true);
    ok(`[c${c}] 방1 잠김중 camps[1]/[2] 스폰 0`, r.campsAliveWhileLocked[1]===0 && r.campsAliveWhileLocked[2]===0, JSON.stringify(r.campsAliveWhileLocked));
    ok(`[c${c}] 목표 화살표가 잠긴 방 안 가리킴`, r.targetsLockedCamp===false);
  }
  console.log(`\n═══ 통과 ${pass} / 실패 ${fail} ═══`);
  await b.close();
  process.exit(fail?1:0);
})();
