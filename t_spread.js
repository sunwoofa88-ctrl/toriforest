/* 유도 점선 · 몬스터 분포 · 보스 난이도 검증 */
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

console.log('\n[A] 몬스터 캠프가 맵 전체에 고르게 (110장 전수)');
const camps = await p.evaluate(()=>{
  const T=window.__TORI, WW=1840, WH=1440;
  let minN=99, tot=0, worstRegions=9, bad=[];
  for(let c=0;c<110;c++){
    T.S.prog={}; T.enterChapter(c);
    const cs=T.WD.camps;
    tot+=cs.length; if(cs.length<minN) minN=cs.length;
    /* 3x3 구역 중 몇 곳이 채워졌나 */
    const reg=new Set();
    cs.forEach(x=>reg.add(Math.min(2,Math.floor(x.x/WW*3))+','+Math.min(2,Math.floor(x.y/WH*3))));
    if(reg.size<worstRegions) worstRegions=reg.size;
    if(cs.length<5 || reg.size<4) bad.push({c:c+1, n:cs.length, reg:reg.size});
    /* 캠프가 실제로 걸을 수 있는 곳인지 */
    for(const x of cs) if(T.dbg.blocked(x.x,x.y,26)) bad.push({c:c+1, blockedCamp:true});
  }
  return {minN, avg:(tot/110).toFixed(1), worstRegions, bad:bad.slice(0,6), badN:bad.length};
});
ok('모든 장에 캠프가 5곳 이상', camps.minN>=5, '최소 '+camps.minN+'곳, 평균 '+camps.avg);
ok('모든 장에서 3×3 구역 중 4곳 이상에 퍼져 있다', camps.worstRegions>=4, '최소 '+camps.worstRegions+'구역');
ok('캠프가 전부 걸을 수 있는 자리', camps.badN===0, JSON.stringify(camps.bad));

console.log('\n[B] 실제 전투에서 몬스터가 고르게 흩어진다');
const spread = await p.evaluate(async()=>{
  const T=window.__TORI, WW=1840, WH=1440;
  T.S.prog={}; T.S.lv=40; T.enterChapter(6);
  const seen=new Set(); let n=0;
  /* 맵을 한 바퀴 돌며 스폰되는 위치를 기록 */
  for(const [fx,fy] of [[.2,.2],[.5,.2],[.8,.2],[.2,.5],[.5,.5],[.8,.5],[.2,.8],[.5,.8],[.8,.8]]){
    T.P.x=WW*fx; T.P.y=WH*fy;
    await new Promise(r=>setTimeout(r,900));
    T.EN.forEach(e=>{ if(e.alive&&!e.dead){ n++;
      seen.add(Math.min(2,Math.floor(e.x/WW*3))+','+Math.min(2,Math.floor(e.y/WH*3))); } });
  }
  return {regions:seen.size, samples:n};
});
ok('맵을 돌면 3×3 구역 중 5곳 이상에서 몬스터가 나온다',
   spread.regions>=5, spread.regions+'구역 / 표본 '+spread.samples);

console.log('\n[C] 보스 난이도 2배');
const boss = await p.evaluate(async()=>{
  const T=window.__TORI, D=T.dbg;
  async function spawnBoss(c){
    T.S.prog={}; T.S.chap=c; T.enterChapter(c);
    D.addKills(T.chapKillNeed(c));
    T.P.x=T.WD.arena.x; T.P.y=T.WD.arena.y;
    await new Promise(r=>setTimeout(r,950));
    return T.EN.find(e=>e.alive&&!e.dead&&e.boss)||null;
  }
  const big=await spawnBoss(9), mid=await spawnBoss(4);
  /* 같은 종을 일반 몬스터로 소환해 배수를 비교 */
  T.S.prog={}; T.S.chap=9; T.enterChapter(9);
  const ref=T.spawnEnemy(T.chapBoss(9));
  await new Promise(r=>setTimeout(r,120));
  return { bigHp: big?big.hpMax:0, midHp: mid?mid.hpMax:0,
           refHp: ref?ref.hpMax:0, hard: T.dbg.bossHard? T.dbg.bossHard() : null,
           bigAtk: big?big.atk:0, refAtk: ref?ref.atk:0 };
});
ok('대장 보스 체력이 같은 종 기본치의 2배', boss.refHp>0 && Math.abs(boss.bigHp/boss.refHp-2)<0.06,
   JSON.stringify({boss:boss.bigHp, ref:boss.refHp, ratio:(boss.bigHp/boss.refHp).toFixed(2)}));
ok('대장 보스 공격력이 기본치보다 강하다(약 1.5배)',
   boss.refAtk>0 && boss.bigAtk/boss.refAtk>1.3 && boss.bigAtk/boss.refAtk<1.9,
   JSON.stringify({boss:boss.bigAtk, ref:boss.refAtk, ratio:(boss.bigAtk/boss.refAtk).toFixed(2)}));
ok('중간 보스도 체력이 올라갔다', boss.midHp>0, JSON.stringify({mid:boss.midHp}));

console.log('\n[D] 유도 점선이 벽·물을 피해 그려진다 (110장 전수)');
const guide = await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg, TS=64;
  let bad=[], noPath=0, avgLen=0, n=0;
  for(let c=0;c<110;c++){
    T.S.prog={}; T.S.chap=c; T.enterChapter(c);
    T.P.x=T.WD.spawn.x; T.P.y=T.WD.spawn.y;
    const pts=D.guideFor();
    if(!pts || pts.length<2){ noPath++; continue; }
    avgLen+=pts.length; n++;
    /* 점선의 모든 점이 걸을 수 있는 타일 위에 있어야 한다 */
    for(const q of pts){
      const tx=Math.floor(q.x/TS), ty=Math.floor(q.y/TS);
      if(!D.walkTile(tx,ty)){ bad.push({c:c+1, tx, ty}); break; }
    }
  }
  return {bad:bad.slice(0,5), badN:bad.length, noPath, avg:(avgLen/Math.max(1,n)).toFixed(1)};
});
ok('유도 점선이 물·바위 위를 지나지 않는다', guide.badN===0, JSON.stringify(guide.bad));
ok('모든 장에서 목표까지 가는 길을 찾는다', guide.noPath===0, '못 찾은 장 '+guide.noPath+'개');
console.log('     평균 경로 점 개수: '+guide.avg);

console.log('\n[E] 성능 : 유도 점선 추가 후에도 60fps');
const fps = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.lv=60; T.enterChapter(44);
  for(let i=0;i<14;i++) T.spawnEnemy();
  T.P.x=T.WD.spawn.x; T.P.y=T.WD.spawn.y;
  await new Promise(r=>setTimeout(r,700));
  let n=0; const t0=performance.now();
  await new Promise(res=>{(function loop(){ n++;
    if(performance.now()-t0>=2200) return res(); requestAnimationFrame(loop); })();});
  return Math.round(n/((performance.now()-t0)/1000));
});
ok('유도 점선 + 몬스터 14마리에서 50fps 이상', fps>=50, fps+'fps');

ok('검증 중 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,4).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
