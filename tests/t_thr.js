/* A9+ 조건 재현 시도 : 같은 뷰포트/DPR + CPU 감속 배율을 걸어 프레임 시간을 잰다.
   CDP Emulation.setCPUThrottlingRate 는 크롬 개발자도구의 표준 모바일 흉내 기능이다. */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,rate,W,H,D,label){
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D,isMobile:true,hasTouch:true});
  const cdp=await p.context().newCDPSession(p);
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
  await p.waitForTimeout(2500);
  await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<34;i++)T.spawnEnemy();
    window.__atk=setInterval(()=>{let g=null,d=1e9;
      for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
      if(g)T.doAttack(g.x,g.y-g.size*0.5);},130);});
  if(rate>1) await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>new Promise(res=>{
    let n=0,t0=performance.now(),last=t0,fr=[];
    function tick(){ const t=performance.now(); fr.push(t-last); last=t; n++;
      if(t-t0<7000) requestAnimationFrame(tick);
      else{ fr.sort((a,b)=>a-b);
        const cv=document.querySelector('canvas');
        res({fps:Math.round(n/((t-t0)/1000)), p50:+fr[fr.length>>1].toFixed(1),
             p95:+fr[Math.floor(fr.length*0.95)].toFixed(1), worst:+fr[fr.length-1].toFixed(1),
             under30:+(100*fr.filter(v=>v>33.34).length/fr.length).toFixed(1),
             px:cv.width*cv.height, q:window.__TORI.dbg.aqStat(),
             en:window.__TORI.EN.filter(e=>e.alive&&!e.dead).length}); }
    } requestAnimationFrame(tick);
  }));
  await p.evaluate(()=>clearInterval(window.__atk));
  console.log(`${label.padEnd(26)} ${String(r.fps).padStart(3)}fps  p50 ${String(r.p50).padStart(5)}ms  p95 ${String(r.p95).padStart(6)}ms  30fps미만 ${String(r.under30).padStart(5)}%  캔버스 ${(r.px/1e6).toFixed(2)}M  적${r.en}`);
  await p.close();
}
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 // A9+ 실제 화면 1920x1200. One UI 기본 밀도면 CSS 1280x800 @DPR1.5 가 유력하지만 미확인이므로 둘 다 본다.
 await run(b,1,1280,800,1.5,'A9+ 추정(1280x800@1.5)');
 await run(b,1,960,600,2.0, 'A9+ 대안(960x600@2.0)');
 await run(b,4,1280,800,1.5,'위 조건 + CPU 4배 감속');
 await run(b,6,1280,800,1.5,'위 조건 + CPU 6배 감속');
 await b.close();
})();
