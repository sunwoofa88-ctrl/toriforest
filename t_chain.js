/* 1장부터 12장까지 실제로 이어서 클리어 : 진행 막힘 · 상태 오염 정밀 검사 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
await p.goto(F);
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(400);
await p.evaluate(()=>{ window.__TORI.S.lv=99; window.__TORI.S.prog={}; window.__TORI.enterChapter(0); });
await p.waitForTimeout(300);

console.log('\n[체인] 1장 → 12장 연속 클리어 (문 통과까지 실제 이동)');
const log=[];
for(let step=0; step<12; step++){
  const c = await p.evaluate(()=>window.__TORI.S.chap);
  const kind = await p.evaluate(cc=>window.__TORI.chapIsBoss(cc)?'B':(window.__TORI.chapIsMid(cc)?'M':'.'), c);

  /* 쿼터 채우기 : 실제 공격 */
  let g=0;
  while(g++<5000){
    const done=await p.evaluate(()=>{
      const T=window.__TORI, D=T.dbg;
      if(D.prog().kills>=T.chapKillNeed(T.S.chap)) return true;
      let e=null; for(const x of T.EN) if(x.alive&&!x.dead&&!x.boss){e=x;break;}
      if(!e){ T.spawnEnemy(); return false; }
      T.P.x=e.x; T.P.y=e.y+30; T.doAttack(e.x,e.y-e.size*0.5); return false;
    });
    if(done) break; await p.waitForTimeout(16);
  }
  /* 보스 장이면 성역으로 들어가 실제 전투 */
  if(kind!=='.'){
    await p.evaluate(()=>{ const T=window.__TORI; T.P.x=T.WD.arena.x; T.P.y=T.WD.arena.y; });
    await p.waitForTimeout(1100);
    let bg=0, killed=false;
    while(bg++<4000){
      const r=await p.evaluate(()=>{
        const T=window.__TORI;
        let e=null; for(const x of T.EN) if(x.alive&&!x.dead&&x.boss){e=x;break;}
        if(!e) return T.dbg.prog().boss?2:0;
        T.P.x=e.x; T.P.y=e.y+40; T.S.hp=9999; T.doAttack(e.x,e.y-e.size*0.5); return 1;
      });
      if(r===2){ killed=true; break; }
      await p.waitForTimeout(16);
    }
    ok(`${c+1}장 (${kind==='B'?'보스':'중간보스'}) 보스를 실제 전투로 격파`, killed);
  }
  /* 문 통과 */
  const moved = await p.evaluate(async()=>{
    const T=window.__TORI, before=T.S.chap;
    if(!T.WD.exitGate.open) return {before, after:before, gateOpen:false, obj:T.dbg.objectiveText()};
    for(let i=0;i<90;i++){ await new Promise(r=>requestAnimationFrame(r));
      T.P.x=T.WD.exitGate.x; T.P.y=T.WD.exitGate.y; if(T.S.chap!==before) break; }
    await new Promise(r=>setTimeout(r,1500));
    return {before, after:T.S.chap, gateOpen:true, obj:T.dbg.objectiveText()};
  });
  log.push({c:c+1, kind, ...moved});
  ok(`${c+1}장 ${kind==='.'?'(일반)':(kind==='M'?'(중간보스)':'(보스)')} 클리어 → ${moved.after+1}장`,
     moved.gateOpen && moved.after===moved.before+1, JSON.stringify(moved));
  if(!moved.gateOpen || moved.after!==moved.before+1) break;
}
console.log('     경로: '+log.map(r=>r.c+r.kind).join(' → '));

console.log('\n[상태] 저장/불러오기 왕복');
const rt = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.save();
  const raw=localStorage.getItem(Object.keys(localStorage).find(k=>/tori|dotori|acorn/i.test(k))||'');
  const snap={chap:T.S.chap, prog:JSON.parse(JSON.stringify(T.S.prog)), lv:T.S.lv};
  return {saved:!!raw, snap, keys:Object.keys(localStorage)};
});
ok('진행 상황이 저장된다', rt.saved, JSON.stringify(rt.keys));
await p.reload();
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(700);
const after = await p.evaluate(()=>{
  const T=window.__TORI;
  return {chap:T.S.chap, lv:T.S.lv, obj:T.dbg.objectiveText(),
          exitOpen:T.WD.exitGate.open, kills:T.dbg.prog().kills,
          need:T.chapKillNeed(T.S.chap)};
});
ok('새로고침 후 같은 장에서 이어진다', after.chap===rt.snap.chap, JSON.stringify({want:rt.snap.chap, got:after.chap}));
ok('새로고침 후 진행이 막히지 않는다',
   after.kills<after.need ? after.obj==='몬스터 '+after.kills+' / '+after.need : after.exitOpen||/보스를 찾아라|중간 보스를 찾아라/.test(after.obj),
   JSON.stringify(after));

console.log('\n[내성] 세이브 손상 / 극단값');
const rob = await p.evaluate(()=>{
  const T=window.__TORI, out=[];
  const cases=[
    ['음수 kills',       {kills:-5, boss:0, chests:{}}],
    ['초과 kills',       {kills:999999, boss:0, chests:{}}],
    ['boss만 1',         {kills:0, boss:1, chests:{}}],
    ['qm만 1',           {kills:0, boss:0, qm:1, chests:{}}],
    ['필드 없음',         {}],
    ['chests 배열',      {kills:5, boss:0, chests:[]}]
  ];
  for(const [nm,pg] of cases){
    try{
      T.S.prog={'3':JSON.parse(JSON.stringify(pg))};
      T.S.chap=3; T.enterChapter(3);
      const o=T.dbg.objectiveText();
      out.push({nm, ok:true, obj:o, exit:T.WD.exitGate.open, solid:T.WD.props[T.WD.exitGateProp].solid});
    }catch(e){ out.push({nm, ok:false, err:e.message}); }
  }
  return out;
});
rob.forEach(r=>ok('손상 세이브 내성: '+r.nm, r.ok && typeof r.obj==='string' && r.obj.length>0, JSON.stringify(r)));

ok('체인 전체에서 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,4).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
