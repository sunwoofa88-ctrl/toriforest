/* 갤럭시 탭 A9+ 전용 정밀 검사 : 해상도 · UI · 성능 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
/* 갤럭시 탭 A9+ : 11.0" 1920x1200 패널.
   크롬 CSS 뷰포트는 대략 가로 1280x800 / 세로 800x1280, DPR 1.5 */
const PROFILES=[
  {n:'A9+ 가로 1280x800  DPR1.5', w:1280, h:800,  d:1.5},
  {n:'A9+ 세로 800x1280  DPR1.5', w:800,  h:1280, d:1.5},
  {n:'A9+ 가로 (브라우저바) 1280x736', w:1280, h:736, d:1.5},
  {n:'A9+ 가로 DPR2.0 (고DPI설정)',   w:1280, h:800, d:2.0}
];
(async()=>{
const b=await chromium.launch(['--disable-gpu-vsync']);
for(const P of PROFILES){
  console.log('\n── '+P.n+' ──');
  const p=await b.newPage({viewport:{width:P.w,height:P.h},deviceScaleFactor:P.d,isMobile:true,hasTouch:true});
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
  const t0=Date.now();
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const boot=Date.now()-t0;
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);

  /* 1) 캔버스 해상도가 픽셀 예산 안에서 화면을 정확히 채우는가 */
  const res = await p.evaluate(()=>{
    const cv=document.querySelector('canvas');
    const r=cv.getBoundingClientRect();
    return {cw:cv.width, ch:cv.height, rw:Math.round(r.width), rh:Math.round(r.height),
            vw:window.innerWidth, vh:window.innerHeight,
            dpr:window.__TORI.dpr, q:window.__TORI.quality,
            px:cv.width*cv.height};
  });
  ok('캔버스가 화면을 빈틈없이 채운다',
     Math.abs(res.rw-res.vw)<=2 && Math.abs(res.rh-res.vh)<=2,
     JSON.stringify(res));
  ok('픽셀 예산(150만) 이내 · DPR 상한 준수', res.px<=1500000*1.02 && res.dpr<=2.001,
     `${res.cw}x${res.ch} = ${(res.px/1e6).toFixed(2)}M, DPR ${res.dpr}`);

  /* 2) HUD·조작부가 화면 밖으로 안 나가고 서로 안 겹친다 */
  const ui = await p.evaluate(()=>{
    const W=window.innerWidth, H=window.innerHeight, bad=[], boxes=[];
    const sel='.hud, .plate, .quest, .hud-right, .menu-cluster, #btnAtk, #btnUlt, #btnInh, #stick, .dock, .mbtn';
    document.querySelectorAll(sel).forEach(e=>{
      const r=e.getBoundingClientRect();
      if(r.width<2||r.height<2) return;
      const id=e.id||e.className;
      if(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1) bad.push({id, r:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]});
      boxes.push({id, x:r.left,y:r.top,w:r.width,h:r.height});
    });
    /* 터치 타깃 최소 크기 (아이 손가락 기준 44px) */
    const small=[];
    ['btnAtk','btnUlt','btnInh'].forEach(i=>{ const e=document.getElementById(i);
      if(e){ const r=e.getBoundingClientRect(); if(r.width<44||r.height<44) small.push({i,w:Math.round(r.width),h:Math.round(r.height)}); } });
    document.querySelectorAll('.mbtn').forEach(e=>{ const r=e.getBoundingClientRect();
      if(r.width>2 && (r.width<40||r.height<40)) small.push({i:e.textContent.trim().slice(0,6),w:Math.round(r.width),h:Math.round(r.height)}); });
    /* HUD 가 화면에서 차지하는 비율 */
    const hud=document.querySelector('.hud');
    const hr=hud?hud.getBoundingClientRect():{height:0};
    return {bad, small, hudPct:Math.round(hr.height/H*100), W, H};
  });
  ok('HUD·버튼이 화면 밖으로 안 나간다', ui.bad.length===0, JSON.stringify(ui.bad));
  ok('공격/필살기/메뉴 버튼이 44px 이상', ui.small.length===0, JSON.stringify(ui.small));
  ok('HUD 가 화면의 20% 이하 (맵이 잘 보인다)', ui.hudPct<=20, ui.hudPct+'%');

  /* 3) 좌: 이동 / 우하단: 공격·필살기 배치 (사용자 요구사항) */
  const lay = await p.evaluate(async()=>{
    const T=window.__TORI, W=window.innerWidth, H=window.innerHeight;
    const g=i=>{const e=document.getElementById(i); if(!e) return null; const r=e.getBoundingClientRect();
      return {cx:r.left+r.width/2, cy:r.top+r.height/2, w:r.width, h:r.height};};
    /* 조이스틱은 DOM 이 아니라 캔버스 위 '왼쪽 아래를 누르면 뜨는' 방식이다 → 실제로 눌러 확인 */
    const cv=document.querySelector('canvas'), r=cv.getBoundingClientRect();
    const lx=r.left+r.width*0.18, ly=r.top+r.height*0.78;
    cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:77,clientX:lx,clientY:ly,bubbles:true,cancelable:true}));
    await new Promise(z=>setTimeout(z,80));
    const onLeft=T.__stickOn!==undefined? T.__stickOn : null;
    const moved={vx:T.P.vx, vy:T.P.vy};
    cv.dispatchEvent(new PointerEvent('pointermove',{pointerId:77,clientX:lx+60,clientY:ly,bubbles:true}));
    await new Promise(z=>setTimeout(z,80));
    const after={vx:T.P.vx, vy:T.P.vy};
    cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:77,clientX:lx+60,clientY:ly,bubbles:true}));
    /* 오른쪽 아래를 누르면 조이스틱이 아니라 공격이어야 한다 */
    const rx=r.left+r.width*0.86, ry=r.top+r.height*0.80;
    const k0=T.dbg.prog().kills;
    cv.dispatchEvent(new PointerEvent('pointerdown',{pointerId:78,clientX:rx,clientY:ry,bubbles:true,cancelable:true}));
    await new Promise(z=>setTimeout(z,80));
    const rightIsStick = T.P.vx!==0 || T.P.vy!==0;
    cv.dispatchEvent(new PointerEvent('pointerup',{pointerId:78,clientX:rx,clientY:ry,bubbles:true}));
    return {atk:g('btnAtk'), ult:g('btnUlt'), W, H, stickMoved:(after.vx!==0||after.vy!==0), rightIsStick};
  });
  ok('화면 왼쪽 아래를 끌면 캐릭터가 이동한다(가상 조이스틱)',
     lay.stickMoved===true, JSON.stringify({moved:lay.stickMoved}));
  ok('화면 오른쪽 아래는 이동이 아니라 공격', lay.rightIsStick===false, JSON.stringify(lay.rightIsStick));
  ok('공격·필살기 버튼이 화면 오른쪽 아래',
     lay.atk && lay.atk.cx > lay.W*0.58 && lay.atk.cy > lay.H*0.45 &&
     lay.ult && lay.ult.cx > lay.W*0.55 && lay.ult.cy > lay.H*0.40,
     JSON.stringify({atk:lay.atk, ult:lay.ult}));

  /* 4) 시트(가방/펫/도감/지도)가 화면 안에 들어오고 스크롤이 되는가 */
  const sheets = await p.evaluate(async()=>{
    const T=window.__TORI, out=[];
    for(const k of ['bag','pet','book','make','map']){
      try{
        T.openSheet(k); await new Promise(r=>setTimeout(r,320));
        const sh=document.getElementById('sheet')||document.querySelector('.sheet');
        const bd=document.getElementById('sheetBody');
        if(!sh||!bd){ out.push({k,miss:1}); T.closeSheet(); continue; }
        const r=sh.getBoundingClientRect();
        out.push({k, over: r.right>window.innerWidth+1 || r.left<-1 || r.bottom>window.innerHeight+1,
                  scrollable: bd.scrollHeight<=bd.clientHeight+1 || bd.clientHeight>0,
                  hOver: bd.scrollWidth > bd.clientWidth+2});
        T.closeSheet(); await new Promise(r=>setTimeout(r,240));
      }catch(e){ out.push({k, err:e.message}); }
    }
    return out;
  });
  ok('모든 시트가 화면 안에 들어온다', sheets.every(s=>!s.over&&!s.miss&&!s.err), JSON.stringify(sheets));
  ok('시트에 가로 넘침 없음', sheets.every(s=>!s.hOver), JSON.stringify(sheets.filter(s=>s.hOver)));

  /* 5) 성능 : 평상 / 전투(몬스터 다수 + 필살기) */
  async function fps(ms){
    return await p.evaluate(async(ms)=>{
      let n=0; const t0=performance.now();
      await new Promise(res=>{ (function loop(){ n++;
        if(performance.now()-t0>=ms) return res(); requestAnimationFrame(loop); })(); });
      return Math.round(n/((performance.now()-t0)/1000));
    }, ms);
  }
  const idle=await fps(1400);
  await p.evaluate(()=>{ const T=window.__TORI; T.S.lv=70; T.S.chap=44; T.enterChapter(44);
    for(let i=0;i<16;i++) T.spawnEnemy(); });
  await p.waitForTimeout(700);
  await p.evaluate(()=>{ const T=window.__TORI; T.S.ult=100; T.doUlt(); });
  const fight=await fps(2000);
  const heap=await p.evaluate(()=>Math.round((performance.memory?performance.memory.usedJSHeapSize:0)/1048576));
  console.log(`     부팅 ${boot}ms · 평상 ${idle}fps · 전투 ${fight}fps · 힙 ${heap}MB · 품질 ${res.q} · 캔버스 ${res.cw}x${res.ch}`);
  ok('평상 55fps 이상', idle>=55, idle+'fps');
  ok("전투(몬스터 다수 + 필살기) 35fps 이상", fight>=35, fight+"fps");
  ok('메모리 60MB 이하', heap<=60, heap+'MB');
  ok('에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
  await p.close();
}
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
