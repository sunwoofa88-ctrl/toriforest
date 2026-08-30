/* 프레임 '평균'이 아니라 '흔들림(p95/p99)'을 잰다 — 끊김의 진짜 지표 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const PROF=[
  {n:'A9+ 가로 1280x800 DPR1.5', w:1280,h:800,d:1.5},
  {n:'A9+ 세로 800x1280 DPR1.5', w:800,h:1280,d:1.5},
];
(async()=>{
const b=await chromium.launch({args:['--disable-gpu-vsync','--disable-frame-rate-limit']});
for(const P of PROF){
  const p=await b.newPage({viewport:{width:P.w,height:P.h},deviceScaleFactor:P.d,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))errs.push(m.text())});
  const t0=Date.now(); await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const boot=Date.now()-t0;
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);
  async function stat(ms){
    return await p.evaluate(async(ms)=>{
      const d=[]; let prev=performance.now();
      await new Promise(res=>{(function L(){const t=performance.now();d.push(t-prev);prev=t;
        if(t-d.t0>0){} if(d.length>2 && performance.now()-d.__s>=ms) return res();
        if(!d.__s) d.__s=performance.now();
        requestAnimationFrame(L);})();});
      d.shift();d.shift();
      const s=d.slice().sort((a,b)=>a-b);
      const q=f=>+s[Math.min(s.length-1,Math.floor(s.length*f))].toFixed(2);
      return {n:d.length, fps:Math.round(1000/(d.reduce((a,c)=>a+c,0)/d.length)),
              p50:q(.5), p95:q(.95), p99:q(.99), max:+s[s.length-1].toFixed(2)};
    },ms);
  }
  const idle=await stat(1600);
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.S.chap=44;T.enterChapter(44);
    for(let i=0;i<16;i++)T.spawnEnemy();});
  await p.waitForTimeout(700);
  await p.evaluate(()=>{const T=window.__TORI;T.S.ult=100;T.doUlt();});
  const fight=await stat(2400);
  await p.evaluate(()=>{const T=window.__TORI;T.S.ult=100;T.doUlt();});
  const heap=await p.evaluate(()=>Math.round((performance.memory?performance.memory.usedJSHeapSize:0)/1048576));
  const aq=await p.evaluate(()=>{try{return {n:window.__TORI.dbg.aq?window.__TORI.dbg.aq():null};}catch(e){return null;}});
  console.log(`\n── ${P.n} ──  부팅 ${boot}ms · 힙 ${heap}MB`);
  console.log(`   평상 : ${idle.fps}fps  p50 ${idle.p50} p95 ${idle.p95} p99 ${idle.p99} max ${idle.max}ms`);
  console.log(`   전투 : ${fight.fps}fps  p50 ${fight.p50} p95 ${fight.p95} p99 ${fight.p99} max ${fight.max}ms`);
  if(errs.length) console.log('   ERR:',errs.slice(0,3));
  await p.close();
}
await b.close();
})();
