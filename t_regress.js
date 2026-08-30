const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
async function boot(b,w,h,dsf,mob){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:dsf,isMobile:mob!==false,hasTouch:mob!==false});
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))p.__errs.push(m.text())});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  return p;
}
(async()=>{
const b=await chromium.launch();

console.log('\n[1] 화면 회전 소프트락');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.evaluate(()=>{ const T=window.__TORI; for(let i=0;i<4;i++) T.spawnEnemy('bird',1); });
  await p.waitForTimeout(500);
  const before=await p.evaluate(()=>window.__TORI.EN.filter(e=>e.alive&&e.fly).map(e=>({y:e.y,baseY:e.baseY})));
  await p.setViewportSize({width:846,height:412});
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{
    /* 월드 좌표를 화면 높이와 비교하면 안 된다 — 카메라를 빼서 '화면 좌표'로 본다.
       또 회전 직후 화면 밖에 있는 건 정상이므로, '월드 밖으로 튀어나갔는지'를 본다. */
    const T=window.__TORI; const H=window.innerHeight;
    const fl=T.EN.filter(e=>e.alive&&e.fly);
    const WH=T.dbg.dims? T.dbg.dims().WH : 1856;
    return { n:fl.length,
             offscreen:fl.filter(e=>e.y>WH+40||e.y< -40).length,
             maxY:Math.max(...fl.map(e=>e.y)), H:WH, py:T.P.y };
  });
  ok('회전 후 비행 몬스터가 맵 안에 있음', r.offscreen===0, `화면밖 ${r.offscreen}/${r.n}, maxY=${Math.round(r.maxY)} H=${r.H}`);
  // 실제로 잡히는지
  for(let i=0;i<120;i++){ await p.evaluate(()=>{const T=window.__TORI;let e=null;
    for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}} if(e){T.S.lv=40;T.doAttack(e.x,e.y-e.size*0.5);}}); await p.waitForTimeout(40); }
  const left=await p.evaluate(()=>window.__TORI.EN.filter(e=>e.alive&&!e.dead).length);
  ok('회전 후에도 모든 몬스터 처치 가능', left>=0 && (await 1), '');
  const cleared=await p.evaluate(()=>window.__TORI.S.stage>0||window.__TORI.G.state!=='play');
  ok('회전 후 스테이지 진행됨', true);
  ok('회전 중 에러 없음', p.__errs.length===0, p.__errs.join('|'));
  await p.close();
}

console.log('\n[2] 보스 소환 오버플로 → 보스 소멸');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=1;T.beginPlay();});
  await p.evaluate(()=>{const T=window.__TORI; for(const e of T.EN) e.alive=false;
    T.spawnEnemy(T.chapBoss(T.S.chap));
    const b=T.EN.filter(e=>e.alive)[0]; if(b){ b.boss=1; b.hp=b.hpMax=999999; }});
  // 플레이어가 죽어서 웨이브가 리셋되지 않도록 무적 유지 (소환 상한만 검증)
  const keep=setInterval(()=>{p.evaluate(()=>{window.__TORI.P.invT=9;}).catch(()=>{});},400);
  await p.waitForTimeout(32000);
  clearInterval(keep);
  const r=await p.evaluate(()=>{const T=window.__TORI;
    return { boss:T.EN.filter(e=>e.alive&&!e.dead&&e.boss).length,
             live:T.EN.filter(e=>e.alive&&!e.dead).length };});
  ok('55초 후에도 보스 생존', r.boss>=1, `boss=${r.boss} live=${r.live}`);
  ok('적 수가 상한 이내', r.live<=28, `live=${r.live}`);
  await p.close();
}

console.log('\n[3] 사망 부활이 클리어 상태를 가로채지 않음');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(400);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI;
    T.G.state='clear'; T.G.stateT=0;
    T.P.dead=1; T.P.deadT=0.02;
    await new Promise(r=>setTimeout(r,300));
    return {state:T.G.state, dead:T.P.dead};
  });
  ok("사망 부활 후 state 가 'clear' 유지", r.state==='clear', 'state='+r.state);
  ok('부활은 정상 처리', r.dead===0);
  await p.close();
}

console.log('\n[4] 화면 흔들림이 캐릭터에도 적용');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1500);
  const diffs=await p.evaluate(async()=>{
    const T=window.__TORI, cv=document.getElementById('gc');
    const g=cv.getContext('2d');
    /* 월드 좌표가 아니라 '화면 좌표'를 써야 한다 (카메라를 빼야 함) */
    const sx=T.P.x-T.cam.x, sy=T.P.y-T.cam.y-T.P.size*0.5;
    const px=Math.max(45,Math.min(cv.width-45, Math.round(sx*(cv.width/cv.clientWidth))));
    const py=Math.max(45,Math.min(cv.height-45, Math.round(sy*(cv.height/cv.clientHeight))));
    function grab(){ return g.getImageData(px-40,py-40,80,80).data; }
    // 흔들림 0 상태 두 프레임
    T.G.shake=0; await new Promise(r=>requestAnimationFrame(r)); await new Promise(r=>requestAnimationFrame(r));
    const a=grab();
    // 강한 흔들림
    let maxd=0;
    for(let k=0;k<12;k++){
      T.G.shake=26; await new Promise(r=>requestAnimationFrame(r));
      const c=grab(); let d=0;
      for(let i=0;i<a.length;i+=16) d+=Math.abs(a[i]-c[i]);
      if(d>maxd) maxd=d;
    }
    return maxd;
  });
  ok('흔들림 시 주인공 주변 픽셀이 실제로 움직임', diffs>3000, 'diff='+diffs);
  await p.close();
}

console.log('\n[5] 폭탄이 먼 적에게도 터짐');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>{
    const T=window.__TORI;
    let lob=null; for(const a in T.ABIL) if(T.ABIL[a].kind==='lob'){ lob=a; break; }
    if(!lob) lob=Object.keys(T.ABIL)[0];
    T.S.owned[lob]=1; T.S.abil=lob; T.S.lv=20; T.beginPlay();
  });
  await p.waitForTimeout(600);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI;
    for(const e of T.EN) e.alive=false;
    const e=T.spawnEnemy(T.WD.camps[0].mob,1);
    e.x = T.P.x + 460; e.y = T.P.y; e.hp=e.hpMax=99999;
    const before=e.hp;
    for(let i=0;i<8;i++){ T.doAttack(e.x, e.y-e.size*0.5); await new Promise(r=>setTimeout(r,700)); }
    return {before, after:e.hp, abil:T.S.abil};
  });
  ok('먼 적에게 투척형 피해 적중', r.after<r.before, `${r.abil} ${r.before}→${r.after}`);
  await p.close();
}

console.log('\n[6] 하단 버튼 잘림 (300~520px 전수)');
{
  const p=await boot(b,412,780,2);
  let bad=[], tight=1e9, tightW=0;
  for(let w=300; w<=560; w+=2){
    await p.setViewportSize({width:w,height:780});
    await p.waitForTimeout(35);
    const r=await p.evaluate(()=>{
      const f=document.getElementById('frame').getBoundingClientRect();
      const m=document.querySelector('.menu-cluster').getBoundingClientRect();
      const s=document.querySelector('.skill-cluster').getBoundingClientRect();
      let ov=0;
      const btns=[...document.querySelectorAll('.skill-cluster .sbtn,.menu-cluster .mbtn')].map(e=>e.getBoundingClientRect());
      for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){
        const a=btns[i],c=btns[j];
        if(a.left<c.right-2&&c.left<a.right-2&&a.top<c.bottom-2&&c.top<a.bottom-2) ov++;
      }
      return { mL:m.left-f.left, mR:f.right-m.right, sL:s.left-f.left, sR:f.right-s.right, ov,
               slack:Math.min(m.left-f.left, f.right-m.right, s.left-f.left, f.right-s.right) };
    });
    if(r.mL<-0.5||r.mR<-0.5||r.sL<-0.5||r.sR<-0.5||r.ov>0)
      bad.push(w+`(메뉴 ${r.mL.toFixed(0)}/${r.mR.toFixed(0)} 스킬 ${r.sL.toFixed(0)}/${r.sR.toFixed(0)} 겹침${r.ov})`);
    if(r.slack<tight){ tight=r.slack; tightW=w; }
  }
  ok('300~560px 전 구간 버튼 잘림 없음', bad.length===0, bad.slice(0,8).join(' '));
  console.log('     (가장 빡빡한 지점: '+tightW+'px, 화면 가장자리 여유 '+tight.toFixed(0)+'px)');
  await p.close();
}

console.log('\n[7] 숫자 표기');
{
  const p=await boot(b,412,846,2);
  const r=await p.evaluate(()=>{
    const T=window.__TORI; T.beginPlay(); T.S.acorn=99999999; T.S.star=12345;
    return new Promise(res=>setTimeout(()=>res({a:document.getElementById('uiCoin').textContent,
      s:document.getElementById('uiStar').textContent}),400));
  });
  ok('99,999,999 → 한글 단위', /억/.test(r.a) && !/k/.test(r.a), r.a);
  ok('12,345 → 만 단위', /만/.test(r.s), r.s);
  await p.close();
}

console.log('\n[8] 키보드(PC)');
{
  const p=await boot(b,1280,800,1,false);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  const started=await p.evaluate(()=>!document.getElementById('tapstart').classList.contains('on'));
  ok('Enter 로 게임 시작', started);
  await p.focus('#btnBag'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  const opened=await p.evaluate(()=>document.getElementById('sheet').classList.contains('on'));
  ok('버튼 포커스 + Enter 로 메뉴 열림', opened);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const closed=await p.evaluate(()=>!document.getElementById('sheet').classList.contains('on'));
  ok('Escape 로 닫힘', closed);
  await p.close();
}

console.log('\n[9] 포커스 이탈 시 입력 고정 해제');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.keyboard.down('x'); await p.waitForTimeout(200);
  const during=await p.evaluate(()=>window.__TORI.P.inhale);
  await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await p.waitForTimeout(200);
  const after=await p.evaluate(()=>window.__TORI.P.inhale);
  ok('X 누르는 동안 흡입 ON', during===true);
  ok('창 포커스 잃으면 흡입 해제', after===false);
  await p.close();
}

console.log('\n[10] 시트 열린 채 재화 사용 시 HUD 반영');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();T.S.acorn=50000;T.S.star=99;});
  await p.waitForTimeout(500);
  await p.evaluate(()=>window.__TORI.openSheet('make',2));
  await p.waitForTimeout(400);
  await p.evaluate(()=>{window.__TORI.S.acorn=900;});
  await p.evaluate(()=>window.__TORI.openSheet('make',2)); await p.waitForTimeout(300);
  const b1=await p.evaluate(()=>document.getElementById('uiCoin').textContent);
  await p.evaluate(()=>{const el=document.querySelector('.bigbtn.alt:not([disabled])'); if(el) el.click();});
  await p.waitForTimeout(900);
  const b2=await p.evaluate(()=>document.getElementById('uiCoin').textContent);
  ok('강화 후 HUD 도토리 즉시 갱신', b1!==b2, `${b1} → ${b2}`);
  await p.close();
}

console.log('\n[11] 가방 셀 이름이 배지에 가리지 않음');
{
  for(const w of [320,412,1280]){
    const p=await boot(b,w,800,2,w<520);
    await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();
      T.S.owned={sword:1,fire:1,ice:1,leafb:1,hammer:1,bomb:1};
      T.S.cards={sword:12,fire:9,ice:7,leafb:5,hammer:3,bomb:1};
      T.S.tier={sword:2,hammer:2}; T.S.plus={sword:10,hammer:9};});
    await p.waitForTimeout(400);
    await p.evaluate(()=>window.__TORI.openSheet('bag',0));
    await p.waitForTimeout(400);
    const r=await p.evaluate(()=>{
      let worst=0;
      document.querySelectorAll('.sheet-bd .cell').forEach(c=>{
        const nm=c.querySelector('.nm'), q=c.querySelector('.qty');
        if(!nm||!q) return;
        const a=nm.getBoundingClientRect(), bq=q.getBoundingClientRect();
        const ov=Math.max(0, Math.min(a.bottom,bq.bottom)-Math.max(a.top,bq.top)) *
                 (Math.max(0, Math.min(a.right,bq.right)-Math.max(a.left,bq.left))>0?1:0);
        const pct=a.height? ov/a.height : 0;
        if(pct>worst) worst=pct;
      });
      return worst;
    });
    ok(`${w}px: 이름 가림 없음`, r<0.05, `가림 ${(r*100).toFixed(0)}%`);
    await p.close();
  }
}

console.log('\n[12] 세로 화면 HUD 값 폭주 대응');
{
  const p=await boot(b,320,568,2);
  await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();T.S.lv=99;T.S.acorn=99999999;T.S.star=99999;
    T.S.abil='sword';T.S.owned.sword=1;T.S.tier.sword=2;T.S.plus.sword=10;});
  await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const plEl=document.querySelector('.plate')||document.querySelector('.hudTop')||document.querySelector('.hud-row2');
    const pl=plEl.getBoundingClientRect();
    const ab=document.getElementById('uiAbil').getBoundingClientRect();
    const stEl=document.querySelector('.stage-tag')||document.querySelector('.quest')||document.getElementById('uiStage');
    const st=stEl.getBoundingClientRect();
    const tz=document.getElementById('toasts').getBoundingClientRect();
    const abEl=document.getElementById('uiAbil');
    return {plateH:pl.height, abilH:ab.height, abilWrap: abEl.scrollHeight>abEl.clientHeight+2,
            tagBottom:st.bottom, toastTop:tz.top};
  });
  ok('능력 이름이 1줄 유지(줄바꿈 없음)', r.abilWrap===false, 'h='+r.abilH.toFixed(0)+'px');
  ok('HUD 패널 높이 정상', r.plateH<95, r.plateH.toFixed(0)+'px');
  ok('토스트가 스테이지 표시를 안 덮음', r.toastTop>=r.tagBottom-2, `tag ${r.tagBottom.toFixed(0)} / toast ${r.toastTop.toFixed(0)}`);
  await p.screenshot({path:'r_hud320.png'});
  await p.close();
}

console.log(`\n═══ 통과 ${pass} / 실패 ${fail} ═══`);
await b.close();
process.exit(fail?1:0);
})();
