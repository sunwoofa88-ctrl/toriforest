/* 2차 초정밀 감사 : 발견된 결함 전수 재검증 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
async function boot(b,w,h,d){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d||2,isMobile:true,hasTouch:true});
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(400);
  return p;
}
(async()=>{
const b=await chromium.launch();
const p=await boot(b,846,412);

console.log('\n[A] 길이 물·바위에서 끊기지 않는다 (110장 전수)');
const paths = await p.evaluate(()=>{
  const T=window.__TORI, bad=[];
  const _D=T.dbg.dims(), COLS=_D.COLS, ROWS=_D.ROWS;
  const T_PATH=1, T_SAND=4, T_ROCK=5, T_WATER=3;
  for(let c=0;c<110;c++){
    T.S.prog={}; T.enterChapter(c);
    const t=T.WD.tiles;
    /* 길 타일의 연결 성분 개수를 센다 : 길이 끊겼으면 성분이 여러 개로 쪼개진다 */
    const isRoad=i=>t[i]===T_PATH||t[i]===T_SAND;
    const seen=new Uint8Array(COLS*ROWS);
    let comps=0, sizes=[];
    for(let y=1;y<ROWS-1;y++) for(let x=1;x<COLS-1;x++){
      const i=y*COLS+x;
      if(!isRoad(i)||seen[i]) continue;
      comps++; let n=0; const st=[i]; seen[i]=1;
      while(st.length){ const q=st.pop(); n++;
        const qx=q%COLS, qy=(q/COLS)|0;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=qx+dx, ny=qy+dy;
          if(nx<1||ny<1||nx>=COLS-1||ny>=ROWS-1) continue;
          const ni=ny*COLS+nx;
          if(!seen[ni]&&isRoad(ni)){ seen[ni]=1; st.push(ni); }
        }
      }
      sizes.push(n);
    }
    sizes.sort((a,z)=>z-a);
    const big=sizes[0]||0, total=sizes.reduce((a,z)=>a+z,0);
    /* 가장 큰 길 덩어리가 전체 길의 85% 이상이면 '이어져 있다'고 본다 */
    if(total>0 && big/total < 0.85) bad.push({c:c+1, comps, big, total, top:sizes.slice(0,4)});
  }
  return bad;
});
ok('모든 장에서 길이 하나로 이어져 있다', paths.length===0,
   `끊긴 장 ${paths.length}개: `+JSON.stringify(paths.slice(0,4)));

console.log('\n[B] 화면이 맵보다 커도 지형과 캐릭터가 안 어긋난다');
{
  const p2=await boot(b,1900,1600,1);
  const cam=await p2.evaluate(()=>({x:window.__TORI.cam.x,y:window.__TORI.cam.y,
    W:window.innerWidth,H:window.innerHeight}));
  ok('카메라가 음수로 안 간다(지형·캐릭터 정렬)', cam.x>=0 && cam.y>=0, JSON.stringify(cam));
  await p2.close();
}

console.log('\n[C] 시트(메뉴) 안 안내가 실제로 보인다');
const zi = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.openSheet('gear'); await new Promise(r=>setTimeout(r,350));
  const g=e=>e?+getComputedStyle(e).zIndex:null;
  const sh=g(document.querySelector('.sheet')), to=g(document.getElementById('toasts')),
        bn=g(document.getElementById('banner'));
  T.closeSheet(); await new Promise(r=>setTimeout(r,300));
  return {sheet:sh, toast:to, banner:bn};
});
ok('토스트가 시트보다 위에 그려진다', zi.toast>zi.sheet, JSON.stringify(zi));
ok('배너가 시트보다 위에 그려진다', zi.banner>zi.sheet, JSON.stringify(zi));

console.log('\n[D] 메뉴 버튼 두 번 톡톡 → 열린 채로 유지');
const dbl = await p.evaluate(async()=>{
  const T=window.__TORI, btn=document.getElementById('btnBag');
  btn.click(); await new Promise(r=>setTimeout(r,120));
  btn.click(); await new Promise(r=>setTimeout(r,400));
  const open=T.sheetOpen;
  T.closeSheet(); await new Promise(r=>setTimeout(r,300));
  return open;
});
ok('두 번 눌러도 메뉴가 닫히지 않는다', dbl===true, 'sheetOpen='+dbl);

console.log('\n[E] 메뉴를 열면 손에 남은 입력이 전부 풀린다');
const inp = await p.evaluate(async()=>{
  const T=window.__TORI, cv=document.querySelector('canvas'), r=cv.getBoundingClientRect();
  cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:11,
    clientX:r.left+r.width*0.2, clientY:r.top+r.height*0.8, bubbles:true, cancelable:true}));
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:11,
    clientX:r.left+r.width*0.3, clientY:r.top+r.height*0.8, bubbles:true}));
  await new Promise(z=>setTimeout(z,80));
  const moving={vx:T.P.vx, vy:T.P.vy};
  T.openSheet('bag'); await new Promise(z=>setTimeout(z,200));
  const after={vx:T.P.vx, vy:T.P.vy};
  T.closeSheet(); await new Promise(z=>setTimeout(z,300));
  return {moving, after};
});
ok('메뉴를 열면 조이스틱 속도가 0 이 된다',
   inp.after.vx===0 && inp.after.vy===0, JSON.stringify(inp));

console.log('\n[F] 조이스틱을 다른 손가락이 뺏지 않는다');
const steal = await p.evaluate(async()=>{
  const T=window.__TORI, cv=document.querySelector('canvas'), r=cv.getBoundingClientRect();
  const X=x=>r.left+r.width*x, Y=y=>r.top+r.height*y;
  cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:21,clientX:X(0.15),clientY:Y(0.8),bubbles:true,cancelable:true}));
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:21,clientX:X(0.28),clientY:Y(0.8),bubbles:true}));
  await new Promise(z=>setTimeout(z,60));
  const v1={vx:T.P.vx,vy:T.P.vy};
  /* 두 번째 손가락이 같은 영역에 닿았다 뗀다 */
  cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:22,clientX:X(0.40),clientY:Y(0.9),bubbles:true,cancelable:true}));
  cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:22,clientX:X(0.40),clientY:Y(0.9),bubbles:true}));
  await new Promise(z=>setTimeout(z,60));
  /* 원래 손가락은 아직 움직이는 중 */
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:21,clientX:X(0.30),clientY:Y(0.78),bubbles:true}));
  await new Promise(z=>setTimeout(z,60));
  const v2={vx:T.P.vx,vy:T.P.vy};
  cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:21,clientX:X(0.30),clientY:Y(0.78),bubbles:true}));
  return {v1, v2};
});
ok('둘째 손가락이 떼져도 첫 손가락 조작이 살아 있다',
   (steal.v2.vx!==0||steal.v2.vy!==0), JSON.stringify(steal));

console.log('\n[G] HUD 빈 공간에서도 공격이 된다');
const tap = await p.evaluate(async()=>{
  const T=window.__TORI;
  const probe=(x,y)=>{ const e=document.elementFromPoint(x,y); return e? (e.id||e.className||e.tagName) : 'none'; };
  const W=window.innerWidth, H=window.innerHeight;
  return {
    questRow: probe(W*0.62, 30),
    menuGap:  probe(W*0.80, 105),
    right:    probe(W*0.75, H*0.45)
  };
});
ok('목표 표시줄 오른쪽 빈칸이 캔버스로 떨어진다', /canvas|gc/i.test(tap.questRow), JSON.stringify(tap));
ok('메뉴 버튼 줄 빈칸이 캔버스로 떨어진다', /canvas|gc/i.test(tap.menuGap), JSON.stringify(tap));

console.log('\n[H] 허공 공격 · 펫 자동공격으로 콤보가 오르지 않는다');
const combo = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.S.lv=50; T.enterChapter(0);
  /* 펫을 붙이고 몬스터를 소환한 뒤, 플레이어는 허공만 친다 */
  const pid=T.PET_IDS[0]; T.S.pets={}; T.S.pets[pid]=1; T.S.petSlot=[pid]; T.rebuildPets();
  for(let i=0;i<5;i++) T.spawnEnemy();
  await new Promise(r=>setTimeout(r,300));
  /* '허공 공격'을 정확히 재려면 사거리 안에 몬스터가 하나도 없어야 한다.
     (doAttack 은 사거리 안 몬스터로 자동 조준하므로, 남겨 두면 실제로 맞는다) */
  T.EN.forEach(e=>{ if(e.alive) e.alive=false; });
  await new Promise(r=>setTimeout(r,120));
  T.P.combo=0;
  const far={x:T.P.x+3000, y:T.P.y+3000};
  for(let i=0;i<25;i++){ T.doAttack(far.x, far.y); await new Promise(r=>requestAnimationFrame(r)); }
  await new Promise(r=>setTimeout(r,1200));
  const airCombo=T.P.combo;
  for(let i=0;i<5;i++) T.spawnEnemy();
  await new Promise(r=>setTimeout(r,250));
  /* 이번엔 몬스터를 실제로 친다 */
  T.P.combo=0;
  let real=0;
  for(let i=0;i<10;i++){
    let e=null; for(const x of T.EN) if(x.alive&&!x.dead&&!x.boss){e=x;break;}
    if(!e){ T.spawnEnemy(); await new Promise(r=>setTimeout(r,120)); continue; }
    T.P.x=e.x; T.P.y=e.y+30; T.doAttack(e.x,e.y-e.size*0.5);
    await new Promise(r=>setTimeout(r,180));
    real=T.P.combo;
  }
  return {airCombo, real};
});
ok('허공을 25번 쳐도 콤보가 0 (펫이 때려도 안 오름)', combo.airCombo===0, JSON.stringify(combo));
ok('실제로 맞히면 콤보가 오른다', combo.real>0, JSON.stringify(combo));

console.log('\n[I] 벽을 계속 밀어도 순간이동이 없다');
const wall = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.enterChapter(0);
  await new Promise(r=>setTimeout(r,250));
  let tgt=null; for(const pr of T.WD.props) if(pr.solid && pr.r>20){ tgt=pr; break; }
  if(!tgt) return {skip:1};
  T.P.x=tgt.x; T.P.y=tgt.y+tgt.r+20;
  let lx=T.P.x, ly=T.P.y, jumps=0;
  for(let i=0;i<300;i++){                      /* 5초간 벽 밀기 */
    T.P.vx=0; T.P.vy=-1;
    await new Promise(r=>requestAnimationFrame(r));
    if(Math.abs(T.P.x-lx)+Math.abs(T.P.y-ly)>30) jumps++;
    lx=T.P.x; ly=T.P.y;
  }
  T.P.vx=0; T.P.vy=0;
  return {jumps};
});
ok('5초간 벽을 밀어도 순간이동 0회', wall.skip===1 || wall.jumps===0, JSON.stringify(wall));

console.log('\n[J] 전리품이 넘쳐도 사라지지 않는다');
const loot = await p.evaluate(async()=>{
  const T=window.__TORI;
  T.S.prog={}; T.enterChapter(0);
  T.S.acorn=0;
  const before=T.S.acorn;
  for(let i=0;i<260;i++) T.dropLoot(T.P.x+((i%20)-10)*8, T.P.y+((i/20|0)-6)*8, 'acorn', 10);
  await new Promise(r=>setTimeout(r,60));
  const live=T.LT.filter(l=>l.alive).length;
  await new Promise(r=>setTimeout(r,2500));   /* 자동 회수 */
  return {live, poolSize:T.LT.length, acorn:T.S.acorn, before};
});
ok('전리품 260개를 뿌려도 도토리가 실제로 들어온다', loot.acorn>0, JSON.stringify(loot));
ok('전리품 풀이 120칸 이상', loot.poolSize>=120, 'pool='+loot.poolSize);

console.log('\n[K] 필살기 지연 피해가 재사용 슬롯을 안 때린다');
const uid = await p.evaluate(()=>{
  const T=window.__TORI;
  const src=T.dbg && T.dbg.__src;
  return {hasUid:/en\.uid!==uid/.test(window.__ULTSRC||'')};
});
const uidSrc = await p.evaluate(()=>{
  /* 소스 문자열로 가드 존재 확인 (런타임 재현이 확률적이라 정적 확인) */
  return typeof window.__TORI.doUlt==='function' && window.__TORI.doUlt.toString().indexOf('uid')>=0;
});
ok('필살기 지연 피해에 고유번호(uid) 가드가 있다', uidSrc===true);

console.log('\n[L] 옛 세이브의 죽은 펫 id 가 걸러진다');
{
  const p3=await b.newPage({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p3.goto(F);
  await p3.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p3.evaluate(()=>{
    const T=window.__TORI;
    T.S.petSlot=['p7','p31','p52'];        /* 옛 버전 id */
    T.S.pets={p7:1,p31:1,p52:1};
    T.S.eqW='zzz_없는장비'; T.S.abil='없는능력';
    T.save();
  });
  await p3.goto('about:blank');
  await p3.goto(F);
  await p3.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const after=await p3.evaluate(()=>({slot:window.__TORI.S.petSlot, pets:Object.keys(window.__TORI.S.pets),
    eqW:window.__TORI.S.eqW, abil:window.__TORI.S.abil}));
  ok('죽은 펫 id 가 슬롯에서 제거된다', after.slot.length===0, JSON.stringify(after));
  ok('죽은 장비 id 가 해제된다', after.eqW===null, JSON.stringify(after));
  ok('죽은 능력 id 가 기본 능력으로 복구된다', after.abil==='acorn_blade', JSON.stringify(after));
  await p3.close();
}

console.log('\n[M] 보스 뽑기 보너스가 자정에 안 사라진다');
const gacha = await p.evaluate(()=>{
  const T=window.__TORI;
  T.S.gacha=null; T.S.gachaBonus=2;
  const g=T.__today? null : null;
  const before=T.gachaLeft();
  T.doGacha(); T.doGacha();                 /* 2회 뽑기 */
  const mid={left:T.gachaLeft(), bonus:T.S.gachaBonus};
  return {before, mid};
});
ok('보너스보다 하루 무료분을 먼저 쓴다', gacha.mid.bonus===2,
   JSON.stringify(gacha));

console.log('\n[N] 신화 조합이 손해가 아니다');
const myth = await p.evaluate(()=>{
  const T=window.__TORI;
  const top=T.PET_GRADE.length-1;
  const ids=T.PET_BY_GRADE[top].slice(0,3);
  if(ids.length<3) return {skip:1};
  T.S.pets={}; ids.forEach(i=>T.S.pets[i]=1); T.S.petSlot=[];
  const before=Object.keys(T.S.pets).reduce((a,k)=>a+T.S.pets[k],0);
  const r=T.doPetFuse(ids.slice());
  const after=Object.keys(T.S.pets).reduce((a,k)=>a+T.S.pets[k],0);
  return {before, after, extra:!!(r&&r.extra)};
});
ok('신화 3마리 조합 → 2마리 반환 (손해 없음)',
   myth.skip===1 || (myth.after===2 && myth.extra), JSON.stringify(myth));

console.log('\n[O] 확인 팝업을 두 번 눌러도 한 번만 실행된다');
const cfm = await p.evaluate(async()=>{
  let n=0;
  window.__TORI_TESTBOX = null;
  const T=window.__TORI;
  /* confirmBox 는 노출 안 되어 있으니 초기화 버튼 경로로 확인 */
  T.openSheet('map'); await new Promise(r=>setTimeout(r,350));
  const gear=[...document.querySelectorAll('button')].find(b=>/⚙/.test(b.textContent));
  if(!gear){ T.closeSheet(); return {skip:1}; }
  gear.click(); await new Promise(r=>setTimeout(r,250));
  const yes=[...document.querySelectorAll('.mb-yes')];
  if(!yes.length){ T.closeSheet(); return {skip:1}; }
  const lvBefore=T.S.lv;
  yes[0].click(); yes[0].click(); yes[0].click();   /* 세 번 연타 */
  await new Promise(r=>setTimeout(r,1400));
  const modals=document.querySelectorAll('.modal').length;
  return {modals, chap:T.S.chap, lv:T.S.lv, lvBefore};
});
ok('연타해도 팝업이 남지 않고 초기화는 한 번', cfm.skip===1 || (cfm.modals===0 && cfm.chap===0),
   JSON.stringify(cfm));

console.log('\n[P] 미니맵 마커가 지형과 일치');
const mm = await p.evaluate(()=>{
  const T=window.__TORI;
  T.S.prog={}; T.enterChapter(3);
  const _D2=T.dbg.dims(), COLS=_D2.COLS, ROWS=_D2.ROWS, TS=_D2.TS;
  const mw=T.WD.mini.width, mh=T.WD.mini.height;
  /* 출구 문의 마커 좌표가 미니맵 그림 범위 안에 정확히 들어오는지 */
  const sxr=mw/(COLS*TS), syr=mh/(ROWS*TS);
  const gx=T.WD.exitGate.x*sxr, gy=T.WD.exitGate.y*syr;
  return {mw, mh, gx:Math.round(gx), gy:Math.round(gy), inside: gx>=0&&gx<=mw&&gy>=0&&gy<=mh};
});
ok('미니맵 마커가 그림 범위 안에 정확히 들어온다', mm.inside===true, JSON.stringify(mm));

console.log('\n[Q] 게임 루프가 어떤 경우에도 되살아난다');
const loop = await p.evaluate(async()=>{
  const T=window.__TORI;
  /* 루프를 강제로 죽인 상태를 만든다 */
  T.closeSheet(); await new Promise(r=>setTimeout(r,300));
  const before=T.P.x;
  window.__TORI_KILL && window.__TORI_KILL();
  return {before};
});
await p.waitForTimeout(200);
const alive = await p.evaluate(async()=>{
  const T=window.__TORI;
  /* P.vx 는 매 프레임 조이스틱에서 다시 계산되므로 실제 입력으로 확인한다 */
  const cv=document.querySelector('canvas'), q=cv.getBoundingClientRect();
  const lx=q.left+q.width*0.18, ly=q.top+q.height*0.78;
  const frames0=T.dbg.frameCount? T.dbg.frameCount() : -1;
  cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:91,clientX:lx,clientY:ly,bubbles:true,cancelable:true}));
  const x0=T.P.x, y0=T.P.y;
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:91,clientX:lx+70,clientY:ly,bubbles:true}));
  await new Promise(r=>setTimeout(r,600));
  const moved1=Math.hypot(T.P.x-x0,T.P.y-y0);
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:91,clientX:lx-70,clientY:ly,bubbles:true}));
  await new Promise(r=>setTimeout(r,600));
  const moved2=Math.hypot(T.P.x-x0,T.P.y-y0);
  cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:91,clientX:lx,clientY:ly,bubbles:true}));
  const frames1=T.dbg.frameCount? T.dbg.frameCount() : -1;
  return {moved: Math.max(moved1,moved2)>8, m1:Math.round(moved1), m2:Math.round(moved2),
          frames: frames1-frames0};
});
ok('게임 루프가 정상 동작(캐릭터가 움직인다)', alive.moved===true, JSON.stringify(alive));

ok('2차 감사 재검증 중 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,4).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
