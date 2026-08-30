/* 실제 플레이 경로 : 1장에서 몬스터를 다 잡고 문 앞으로 걸어가 본다 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
p.__toasts=[];
await p.goto(F);
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>{
  window.__T=[];
  const obs=new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes)
    if(n.nodeType===1 && n.className && /toast/.test(n.className)) window.__T.push(n.textContent.trim()); });
  obs.observe(document.body,{childList:true,subtree:true});
});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(500);

for(const ch of [0, 4, 9]){
  const label = ch+1;
  const kind  = await p.evaluate(c=>window.__TORI.chapIsBoss(c)?'대장보스':(window.__TORI.chapIsMid(c)?'중간보스':'일반'), ch);
  console.log(`\n[${label}장 · ${kind}] 실제 전투 → 문 앞으로 이동`);

  await p.evaluate(c=>{ const T=window.__TORI; T.S.prog={}; T.S.lv=99; T.S.chap=c; T.enterChapter(c); window.__T.length=0; }, ch);
  await p.waitForTimeout(350);

  /* 몬스터를 실제 공격으로 잡는다 (쿼터 채울 때까지) */
  const need = await p.evaluate(c=>window.__TORI.chapKillNeed(c), ch);
  let guard=0;
  while(guard++ < 4000){
    const done = await p.evaluate(()=>{
      const T=window.__TORI, D=T.dbg;
      if(D.prog().kills >= T.chapKillNeed(T.S.chap)) return true;
      let e=null; for(const x of T.EN) if(x.alive&&!x.dead&&!x.boss){e=x;break;}
      if(!e){ T.spawnEnemy(); return false; }
      T.P.x=e.x; T.P.y=e.y+30; T.doAttack(e.x, e.y-e.size*0.5);
      return false;
    });
    if(done) break;
    await p.waitForTimeout(20);
  }
  const st = await p.evaluate(()=>{
    const T=window.__TORI, D=T.dbg;
    return {kills:D.prog().kills, need:T.chapKillNeed(T.S.chap), obj:D.objectiveText(),
            exitOpen:T.WD.exitGate.open, arenaOpen:T.WD.arenaGate.open, bgate:T.WD.arenaGateProp>=0};
  });
  ok(`${label}장: 쿼터 ${st.need}마리 실전 처치 완료`, st.kills>=st.need, JSON.stringify(st));

  const expectObj = kind==='일반' ? '다음 장으로!' : (kind==='중간보스' ? '중간 보스를 찾아라!' : '보스를 찾아라!');
  ok(`${label}장: 목표 문구 = "${expectObj}"`, st.obj===expectObj, '실제: '+st.obj);
  ok(`${label}장: 다음 숲 문 상태 = ${kind==='일반'?'열림':'잠김'}`,
     st.exitOpen === (kind==='일반'), JSON.stringify(st));

  /* 다음 숲 문 앞으로 걸어가서 토스트를 확인 */
  /* 보스 성역 안내(gateHintT=4.5초)가 걸려 있을 수 있으므로 쿨다운이 풀릴 때까지 기다린다 */
  await p.evaluate(()=>{ const T=window.__TORI; T.P.x=T.WD.spawn.x; T.P.y=T.WD.spawn.y; });
  await p.waitForTimeout(5200);
  await p.evaluate(()=>{ window.__T.length=0; const T=window.__TORI;
    T.P.x=T.WD.exitGate.x; T.P.y=T.WD.exitGate.y+70; });
  await p.waitForTimeout(2500);
  const toasts = await p.evaluate(()=>window.__T.slice());
  const bad = toasts.filter(t=>/보스를 물리치면/.test(t));
  if(kind==='일반'){
    ok(`${label}장: 문 앞에서 "보스를 물리치면…" 안내가 안 뜬다`, bad.length===0, toasts.join(' | '));
  } else {
    const want = kind==='중간보스' ? '중간 보스를 물리치면' : '보스를 물리치면';
    ok(`${label}장: 문 앞 안내가 "${want} 이 문이 열려요!"`,
       toasts.some(t=>t.indexOf(want)>=0), toasts.join(' | ') || '(토스트 없음)');
  }

  /* 일반 장은 문을 실제로 통과해 다음 장으로 넘어가야 한다 */
  if(kind==='일반'){
    const moved = await p.evaluate(async()=>{
      const T=window.__TORI, before=T.S.chap;
      T.P.x=T.WD.exitGate.x; T.P.y=T.WD.exitGate.y;
      for(let i=0;i<70;i++){ await new Promise(r=>requestAnimationFrame(r));
        T.P.x=T.WD.exitGate.x; T.P.y=T.WD.exitGate.y; if(T.S.chap!==before) break; }
      await new Promise(r=>setTimeout(r,1600));
      return {before, after:T.S.chap};
    });
    ok(`${label}장: 문을 통과해 ${label+1}장으로 넘어간다`,
       moved.after===moved.before+1, JSON.stringify(moved));
  } else {
    /* 보스 장은 성역 안으로 들어가면 보스가 소환되고, 잡으면 문이 열려야 한다 */
    const bo = await p.evaluate(async()=>{
      const T=window.__TORI, D=T.dbg;
      T.P.x=T.WD.arena.x; T.P.y=T.WD.arena.y;
      await new Promise(r=>setTimeout(r,900));
      const bs=T.EN.filter(e=>e.alive&&!e.dead&&e.boss);
      if(!bs.length) return {spawned:0};
      D.onBossDefeated();
      return {spawned:1, mid:!!bs[0].mid, exit:T.WD.exitGate.open, obj:D.objectiveText()};
    });
    ok(`${label}장: 성역에서 보스 등장 → 격파 후 문 열림`,
       bo.spawned===1 && bo.exit===true && bo.obj==='다음 장으로!', JSON.stringify(bo));
  }
}

ok('실전 진행 중 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
