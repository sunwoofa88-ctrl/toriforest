const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0,fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
async function boot(b,w,h,dsf,mob){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:dsf,isMobile:mob!==false,hasTouch:mob!==false});
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))p.__errs.push(m.text())});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  return p;
}
(async()=>{
const b=await chromium.launch();

console.log('\n[A] 시트 전체 · 저장/복원');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(800);
  for(const [k,t] of [['bag',0],['bag',1],['bag',2],['make',0],['make',1],['make',2],['book',0],['book',1],['book',2],['map',0]]){
    await p.evaluate(([k,t])=>window.__TORI.openSheet(k,t),[k,t]);
    await p.waitForTimeout(160);
    await p.evaluate(()=>window.__TORI.closeSheet());
    await p.waitForTimeout(120);
  }
  ok('10개 시트/탭 전부 에러 없이 렌더', p.__errs.length===0, p.__errs.slice(0,2).join('|'));
  await p.evaluate(()=>{const T=window.__TORI;T.S.prog['0'].kills=9;T.S.acorn=777;T.S.lv=5;});
  await p.evaluate(()=>window.__TORI.openSheet('map',0)); await p.waitForTimeout(300);
  await p.screenshot({path:'V_map.png'});
  await p.evaluate(()=>window.__TORI.closeSheet()); await p.waitForTimeout(300);
  await p.reload();
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  const r=await p.evaluate(()=>{const S=window.__TORI.S;return{k:S.prog&&S.prog['0']?S.prog['0'].kills:-1,a:S.acorn,lv:S.lv};});
  ok('저장/복원 (진행도·재화·레벨)', r.k===9&&r.a===777&&r.lv===5, JSON.stringify(r));
  await p.close();
}

console.log('\n[B] 목표 → 보스 → 다음 숲 전체 흐름');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(700);
  // 실제 조이스틱(포인터) 입력으로 이동 + 공격
  const SX=100, SY=640;
  await p.mouse.move(SX,SY); await p.mouse.down();
  let quota=false;
  for(let i=0;i<900;i++){
    const r=await p.evaluate(()=>{
      const T=window.__TORI, P=T.P;
      P.invT=9;
      let e=null,bd=1e9;
      for(const x of T.EN){ if(!x.alive||x.dead) continue;
        const d=Math.hypot(x.x-P.x,x.y-P.y); if(d<bd){bd=d;e=x;} }
      let tx,ty;
      if(e && bd<900){ tx=e.x; ty=e.y; }
      else { let best=null,cd=1e9;
        for(const c of T.WD.camps){const d=Math.hypot(c.x-P.x,c.y-P.y); if(d<cd){cd=d;best=c;}}
        tx=best?best.x:P.x; ty=best?best.y:P.y; }
      if(e && bd<170) T.doAttack(e.x,e.y);
      const dx=tx-P.x, dy=ty-P.y, d=Math.hypot(dx,dy)||1;
      return {k:T.S.prog['0'].kills, near:bd, ux:dx/d, uy:dy/d, stop:(e&&bd<120)?1:0};
    });
    if(r.k>=16){ quota=true; break; }
    if(r.stop) await p.mouse.move(SX,SY);
    else await p.mouse.move(SX+r.ux*46, SY+r.uy*46);
    await p.waitForTimeout(40);
  }
  await p.mouse.up();
  ok('몬스터 목표 달성', quota);
  await p.waitForTimeout(500);
  const gateOpen=await p.evaluate(()=>window.__TORI.WD.arenaGate.open);
  ok('보스 성역 문 열림', gateOpen===true);
  // 보스 잡기
  await p.evaluate(()=>{const T=window.__TORI;T.P.x=T.WD.arena.x;T.P.y=T.WD.arena.y;});
  await p.waitForTimeout(1200);
  await p.screenshot({path:'V_boss.png'});
  let bossDead=false;
  for(let i=0;i<600;i++){
    const r=await p.evaluate(()=>{
      const T=window.__TORI;
      let e=null; for(const x of T.EN){if(x.alive&&!x.dead&&x.boss){e=x;break;}}
      if(!e) for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}}
      if(e) T.doAttack(e.x,e.y);
      T.P.invT=9;
      if(T.S.ult>=100) T.doUlt();
      return {boss:T.S.prog['0'].boss};
    });
    if(r.boss){ bossDead=true; break; }
    await p.waitForTimeout(40);
  }
  ok('보스 격파', bossDead);
  await p.waitForTimeout(900);
  const eg=await p.evaluate(()=>({open:window.__TORI.WD.exitGate.open, pet:Object.keys(window.__TORI.S.pets||{}).length}));
  ok('다음 숲 문 열림', eg.open===true);
  ok('보스 보상으로 친구 합류', eg.pet>=1, 'pets='+eg.pet);
  // 문으로 이동 → 지역 전환
  await p.evaluate(()=>{const T=window.__TORI;T.P.x=T.WD.exitGate.x;T.P.y=T.WD.exitGate.y;});
  await p.waitForTimeout(2400);
  const z=await p.evaluate(()=>window.__TORI.S.zone);
  ok('다음 숲으로 이동', z===1, 'zone='+z);
  await p.screenshot({path:'V_zone2.png'});
  ok('전 과정 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join('|'));
  await p.close();
}

console.log('\n[C] 보물상자 · 흡입 · 회전');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(600);
  const before=await p.evaluate(()=>window.__TORI.S.acorn);
  await p.evaluate(()=>{const T=window.__TORI;T.P.x=T.WD.chests[0].x;T.P.y=T.WD.chests[0].y;});
  await p.waitForTimeout(2200);
  const after=await p.evaluate(()=>({a:window.__TORI.S.acorn, o:window.__TORI.WD.chests[0].opened}));
  ok('보물상자 열림 + 보상', after.o===true && after.a>before, JSON.stringify(after));
  // 흡입
  await p.evaluate(()=>{const T=window.__TORI;const c=T.WD.camps[0];T.P.x=c.x;T.P.y=c.y;});
  await p.waitForTimeout(2600);
  for(let i=0;i<200;i++){
    await p.evaluate(()=>{const T=window.__TORI,P=T.P;let e=null;
      for(const x of T.EN){if(x.alive&&!x.dead&&!x.boss){e=x;break;}}
      if(e){P.inhale=true;const dx=e.x-P.x,dy=e.y-P.y,d=Math.sqrt(dx*dx+dy*dy)||1;P.fx=dx/d;P.fy=dy/d;}
      else P.inhale=false; });
    await p.waitForTimeout(45);
  }
  const ab=await p.evaluate(()=>({owned:Object.keys(window.__TORI.S.owned).length, cards:window.__TORI.S.cards}));
  ok('흡입으로 능력/카드 획득', ab.owned>=1 && Object.keys(ab.cards).length>=1, JSON.stringify(ab));
  // 회전
  await p.setViewportSize({width:846,height:412});
  await p.waitForTimeout(900);
  const rot=await p.evaluate(()=>{
    const T=window.__TORI, live=T.EN.filter(e=>e.alive&&!e.dead);
    const oob=live.filter(e=>e.x<0||e.x>1840||e.y<0||e.y>1440).length;
    return {n:live.length,oob:oob,px:Math.round(T.P.x),py:Math.round(T.P.y)};
  });
  ok('회전 후 엔티티 좌표 정상', rot.oob===0, JSON.stringify(rot));
  await p.screenshot({path:'V_land.png'});
  ok('회전 에러 없음', p.__errs.length===0, p.__errs.slice(0,2).join('|'));
  await p.close();
}

console.log(`\n═══ 통과 ${pass} / 실패 ${fail} ═══`);
await b.close();
})();
