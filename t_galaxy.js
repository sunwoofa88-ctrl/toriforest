/* 갤럭시 실기종 규격 전수 검사.
   CSS 크기·DPR 은 삼성 공식 사양(해상도 ÷ 기본 배율)에서 가져왔다.
   한국에서 가장 많이 쓰는 보급형(A 시리즈)까지 포함한다. */
const {chromium}=require('playwright');
const D=[
 {n:'갤A16 / A15 (보급)', w:360,h:800, d:3, slow:6},
 {n:'갤S24 / S23',        w:360,h:780, d:3, slow:3},
 {n:'갤S24 Ultra',        w:384,h:832, d:3.75, slow:3},
 {n:'갤S24+',             w:384,h:832, d:3, slow:3},
 {n:'갤A54 / A34',        w:360,h:800, d:3, slow:5},
 {n:'갤Z플립 펼침',        w:373,h:857, d:3, slow:3},
 {n:'갤Z폴드 펼침',        w:585,h:702, d:2.6, slow:3},
 {n:'갤탭A9+ (목표)',      w:412,h:846, d:2.6, slow:6},
 {n:'갤S8 (구형)',        w:360,h:740, d:3, slow:7},
];
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  console.log('기기                  부팅    평상  전투  최악ms  힙MB  몹수  UI밖  넘침  오류');
  let bad=0;
  for(const dv of D){
    const p=await b.newPage({viewport:{width:dv.w,height:dv.h},deviceScaleFactor:dv.d,
      isMobile:true, hasTouch:true});
    const errs=[];
    p.on('pageerror',e=>errs.push(String(e).slice(0,80)));
    /* ★ 컨테이너 CPU 는 폰보다 훨씬 빠르다. 그냥 재면 전부 60fps 가 나와 의미가 없다.
       CDP 로 CPU 를 조여 실제 기기 급으로 맞춘다.
       보급형(A 시리즈) 6배 · 플래그십(S 시리즈) 3배 — 상대비는 기기 사양 차이를 따랐다. */
    const cdp=await p.context().newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate',{rate: dv.slow});
    const t0=Date.now();
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
    const boot=Date.now()-t0;
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
    await p.waitForTimeout(1800);
    async function fps(sec){
      return await p.evaluate((s)=>new Promise(r=>{
        let n=0, t0=performance.now(), worst=0, last=t0;
        function tick(t){ const dt=t-last; last=t; if(dt>worst) worst=dt; n++;
          if(t-t0<s*1000) requestAnimationFrame(tick); else r({fps:Math.round(n/((t-t0)/1000)), worst:Math.round(worst)}); }
        requestAnimationFrame(tick);
      }), sec);
    }
    const idle=await fps(2.5);
    await p.evaluate(()=>{ const T=window.__TORI; if(T.enterChapter) T.enterChapter(6); });
    await p.waitForTimeout(2500);
    const fight=await fps(3);
    const heap=await p.evaluate(()=>performance.memory? Math.round(performance.memory.usedJSHeapSize/1048576):0);
    const mobs=await p.evaluate(()=>{ const T=window.__TORI; let n=0;
      try{ for(const e of T.EN) if(e.alive) n++; }catch(x){} return n; });
    // UI 가 화면 밖으로 나갔는지
    const ui=await p.evaluate(()=>{
      let out=0, over=0;
      document.querySelectorAll('button,.skbtn,.sbtn,.cell,.tab').forEach(e=>{
        const r=e.getBoundingClientRect();
        if(r.width<1||r.height<1) return;
        if(r.left<-1||r.top<-1||r.right>innerWidth+1||r.bottom>innerHeight+1) out++;
      });
      document.querySelectorAll('.sheet-in,.sheet').forEach(e=>{
        if(e.scrollWidth>e.clientWidth+2) over++;
      });
      return {out,over};
    });
    const okv = ui.out===0 && ui.over===0 && errs.length===0 && fight.fps>=24;
    if(!okv) bad++;
    console.log(dv.n.padEnd(20)+String(boot+'ms').padStart(7)
      +String(idle.fps).padStart(6)+String(fight.fps).padStart(6)
      +String(fight.worst).padStart(8)+String(heap).padStart(6)
      +String(mobs).padStart(6)+String(ui.out).padStart(8)+String(ui.over).padStart(8)
      +'  '+(errs.length? '❌ '+errs[0] : (okv?'✅':'⚠')));
    await p.close();
  }
  console.log('\n문제 기기 '+bad+' / '+D.length);
  await b.close();
})();
