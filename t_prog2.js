/* 장 진행(관문 열림 / 보스 등장) 전수 검증 */
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

/* 110개 장 전수: 장 종류 판정 + 쿼터 달성 시 관문 상태 */
console.log('\n[A] 110개 장 전수 : 쿼터 달성 → 관문/목표 텍스트');
const all = await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg, out=[];
  for(let c=0;c<110;c++){
    T.S.prog={};                       /* 진행도 초기화 */
    T.enterChapter(c);
    const need=T.chapKillNeed(c);
    const isB=T.chapIsBoss(c), isM=T.chapIsMid(c), isAny=D.chapIsAnyBoss(c);
    const o0=D.objectiveText();
    const hasBGateProp = T.WD.arenaGateProp>=0;
    D.addKills(need);                  /* 쿼터만큼 처치 */
    const pg=D.prog();
    const o1=D.objectiveText();
    const rec={c,need,isB,isM,isAny,hasBGateProp,
      o0,o1, qm:!!pg.qm, boss:!!pg.boss,
      exitOpen:T.WD.exitGate.open, arenaOpen:T.WD.arenaGate.open,
      exitSolid:T.WD.props[T.WD.exitGateProp].solid,
      exitKind:T.WD.props[T.WD.exitGateProp].k};
    if(isAny){                          /* 보스 잡은 뒤 */
      D.onBossDefeated();
      rec.exitOpen2=T.WD.exitGate.open;
      rec.exitSolid2=T.WD.props[T.WD.exitGateProp].solid;
      rec.o2=D.objectiveText();
    }
    out.push(rec);
  }
  return out;
});

const norm=all.filter(r=>!r.isAny), mid=all.filter(r=>r.isM), boss=all.filter(r=>r.isB);
console.log(`     일반 ${norm.length}장 / 중간보스 ${mid.length}장 / 대장보스 ${boss.length}장`);

ok('일반 장: 쿼터 달성 시 다음 숲 문이 열린다',
   norm.every(r=>r.exitOpen===true && r.exitSolid===0 && r.exitKind==='gateOpen'),
   JSON.stringify(norm.filter(r=>!r.exitOpen).slice(0,4)));
ok('일반 장: 목표 텍스트가 "다음 장으로!"',
   norm.every(r=>r.o1===(r.c===109?'모두 클리어! 🎉':'다음 장으로!')),
   [...new Set(norm.map(r=>r.o1))].join(' | '));
ok('일반 장: "보스" 라는 말이 목표에 절대 안 나온다',
   norm.every(r=>!/보스/.test(r.o0) && !/보스/.test(r.o1)),
   [...new Set(norm.flatMap(r=>[r.o0,r.o1]))].filter(t=>/보스/.test(t)).join(' | '));
ok('일반 장: 보스 문 자체가 없다',
   norm.every(r=>r.hasBGateProp===false));
ok('중간보스 장: 쿼터 달성해도 다음 숲 문은 잠겨 있다',
   mid.every(r=>r.exitOpen===false && r.exitSolid===1));
ok('중간보스 장: 쿼터 달성 시 보스 문이 열린다',
   mid.every(r=>r.arenaOpen===true && r.hasBGateProp===true));
ok('중간보스 장: 목표가 "중간 보스를 찾아라!"',
   mid.every(r=>r.o1==='중간 보스를 찾아라!'),
   [...new Set(mid.map(r=>r.o1))].join(' | '));
ok('중간보스 장: 보스 격파 후 다음 숲 문이 열린다',
   mid.every(r=>r.exitOpen2===true && r.exitSolid2===0 && r.o2==='다음 장으로!'),
   JSON.stringify(mid.filter(r=>r.o2!=='다음 장으로!').slice(0,3)));
ok('대장보스 장: 쿼터 달성해도 다음 숲 문은 잠겨 있다',
   boss.every(r=>r.exitOpen===false && r.exitSolid===1));
ok('대장보스 장: 목표가 "보스를 찾아라!"',
   boss.every(r=>r.o1==='보스를 찾아라!'),
   [...new Set(boss.map(r=>r.o1))].join(' | '));
ok('대장보스 장: 보스 격파 후 다음 숲 문이 열린다',
   boss.every(r=>r.exitOpen2===true && r.exitSolid2===0 &&
     r.o2===(r.c===109? '모두 클리어! 🎉' : '다음 장으로!')),
   JSON.stringify(boss.filter(r=>!(r.exitOpen2&&r.exitSolid2===0)).slice(0,3)));
ok('모든 장: 쿼터 달성 시 qm 플래그가 정확히 선다', all.every(r=>r.qm===true));
ok('모든 장: 쿼터 전 목표는 "몬스터 0 / N"',
   all.every(r=>r.o0==='몬스터 0 / '+r.need),
   [...new Set(all.map(r=>r.o0))].slice(0,3).join(' | '));

/* 배너 중복 방지: 재입장해도 onQuotaMet 이 다시 안 터진다 */
console.log('\n[B] 재입장 / 이어하기');
const re = await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg;
  T.S.prog={}; T.enterChapter(0);
  D.addKills(T.chapKillNeed(0));
  const a={exit:T.WD.exitGate.open, qm:!!D.prog().qm};
  T.enterChapter(1); T.enterChapter(0);       /* 나갔다 다시 들어오기 */
  const b={exit:T.WD.exitGate.open, obj:D.objectiveText(),
           kind:T.WD.props[T.WD.exitGateProp].k, solid:T.WD.props[T.WD.exitGateProp].solid};
  return {a,b};
});
ok('일반 장 재입장 시 문이 계속 열려 있다',
   re.b.exit===true && re.b.solid===0 && re.b.kind==='gateOpen' && re.b.obj==='다음 장으로!',
   JSON.stringify(re));

/* 구버전 세이브(qm 없음, boss=0, kills 충족) 자동 복구 */
const legacy = await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg;
  T.S.prog={'0':{kills:T.chapKillNeed(0)+3, boss:0, chests:{}}};  /* qm 필드 자체가 없는 옛 세이브 */
  T.S.chap=0; T.enterChapter(0);
  return {exit:T.WD.exitGate.open, obj:D.objectiveText(), qm:!!D.prog().qm, boss:!!D.prog().boss};
});
ok('구버전 세이브(문 잠김 상태)가 재입장 시 자동 복구된다',
   legacy.exit===true && legacy.obj==='다음 장으로!' && legacy.qm===true,
   JSON.stringify(legacy));

/* 실제 전투로 보스가 진짜 소환되는지 (중간보스 4장 · 대장보스 9장) */
console.log('\n[C] 실전 : 보스 실제 소환');
for(const ch of [4,9,14,19,29,49,99]){
  const r = await p.evaluate(async(c)=>{
    const T=window.__TORI, D=T.dbg;
    T.S.prog={}; T.S.chap=c; T.enterChapter(c);
    D.addKills(T.chapKillNeed(c));
    /* 플레이어를 보스 문 앞으로 순간이동 → 성역 안쪽으로 */
    T.P.x=T.WD.arena.x; T.P.y=T.WD.arena.y;
    await new Promise(r=>setTimeout(r,900));
    const bs=T.EN.filter(e=>e.alive&&!e.dead&&e.boss);
    return {c, n:bs.length, mid:bs.length?!!bs[0].mid:null,
            name:bs.length?bs[0].key:null, size:bs.length?bs[0].size:0,
            isMid:T.chapIsMid(c)};
  }, ch);
  ok(`${ch+1}장 (${r.isMid?'중간보스':'대장보스'}) 보스가 실제로 등장`, r.n===1 && r.mid===r.isMid,
     JSON.stringify(r));
}

/* 일반 장에서는 보스가 절대 안 나온다 */
const nb = await p.evaluate(async()=>{
  const T=window.__TORI, D=T.dbg; const bad=[];
  for(const c of [0,1,2,3,5,6,7,8,10,11,12,13,15,20,30,55,77,100]){
    T.S.prog={}; T.S.chap=c; T.enterChapter(c);
    D.addKills(T.chapKillNeed(c));
    T.P.x=T.WD.arena.x; T.P.y=T.WD.arena.y;
    await new Promise(r=>setTimeout(r,420));
    const n=T.EN.filter(e=>e.alive&&!e.dead&&e.boss).length;
    if(n>0) bad.push(c);
  }
  return bad;
});
ok('일반 장에서는 보스가 등장하지 않는다', nb.length===0, '문제 장: '+nb.join(','));

/* 5단계마다 중간 보스 · 10단계에 보스 (화면에 보이는 1-based 번호 기준) */
console.log('\n[D] 요청 사양 : 5단계 중간보스 / 10단계 보스');
const spec = await p.evaluate(()=>{
  const T=window.__TORI, mids=[], bosses=[], norms=[];
  for(let c=0;c<110;c++){
    const label=c+1;                       /* 화면 표기 = c+1 장 */
    if(T.chapIsBoss(c)) bosses.push(label);
    else if(T.chapIsMid(c)) mids.push(label);
    else norms.push(label);
  }
  return {mids, bosses, nNorm:norms.length,
          midMod:[...new Set(mids.map(x=>x%10))], bossMod:[...new Set(bosses.map(x=>x%10))]};
});
console.log('     중간보스 장: '+spec.mids.join(', '));
console.log('     대장보스 장: '+spec.bosses.join(', '));
ok('중간 보스는 5, 15, 25 … (끝자리 5)', spec.midMod.length===1 && spec.midMod[0]===5, JSON.stringify(spec.midMod));
ok('대장 보스는 10, 20, 30 … (끝자리 0)', spec.bossMod.length===1 && spec.bossMod[0]===0, JSON.stringify(spec.bossMod));
ok('보스는 5단계 간격으로 정확히 번갈아 나온다',
   [...spec.mids,...spec.bosses].sort((a,b)=>a-b).every((v,i)=>v===(i+1)*5),
   [...spec.mids,...spec.bosses].sort((a,b)=>a-b).slice(0,8).join(','));

/* 세계지도 시트에 5/10 표시가 제대로 뜨는지 */
const cells = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.chap=0; T.enterChapter(0);
  T.openSheet('map');
  await new Promise(r=>setTimeout(r,350));
  const out=[];
  document.querySelectorAll('#sheetBody .cell').forEach(c=>{
    const n=c.querySelector('div'), t=c.querySelector('.nm');
    if(n&&t) out.push({n:n.textContent.trim(), t:t.textContent.trim()});
  });
  const info=document.querySelector('#sheetBody .info:last-child');
  const txt=info?info.textContent:'';
  T.closeSheet();
  return {out, txt};
});
const cell5=cells.out.find(c=>c.n==='5'), cell10=cells.out.find(c=>c.n==='10'),
      cell15=cells.out.find(c=>c.n==='15'), cell20=cells.out.find(c=>c.n==='20'),
      cell1=cells.out.find(c=>c.n==='1');
ok('세계지도 5장 칸에 "중간보스" 표시', cell5 && cell5.t.replace(/ /g,'')==='중간보스', JSON.stringify(cell5));
ok('세계지도 10장 칸에 "보스" 표시', cell10 && cell10.t==='보스', JSON.stringify(cell10));
ok('세계지도 15장 = 중간보스 · 20장 = 보스',
   cell15&&cell15.t.replace(/ /g,'')==='중간보스'&&cell20&&cell20.t==='보스', JSON.stringify([cell15,cell20]));
ok('세계지도 1장 칸은 보스 표시 없음', cell1 && !/보스/.test(cell1.t), JSON.stringify(cell1));
ok('세계지도 안내문에 5장/10장 규칙이 적혀 있다',
   /5장마다/.test(cells.txt) && /10장마다/.test(cells.txt), cells.txt.slice(0,90));

ok('진행 검증 중 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));

console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
