/* 애니메이션 A/B (통제판) — 화질 잠금 + 마릿수 고정 + 모드 교차반복 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const LBL={0:'애니 끔(원래)',1:'애니 켬(현재)'};
const N=18, SEC=3, ROUNDS=5;
async function win(p,ms){
  return await p.evaluate(s=>new Promise(res=>{
    window.__TORI.dbg.topUp(__N);
    let f0=window.__TORI.dbg.frameCount(), t0=performance.now(), sum=0, k=0;
    const iv=setInterval(()=>{ window.__TORI.dbg.topUp(__N);
      sum+=window.__TORI.EN.filter(e=>e.alive&&!e.dead).length; k++; },200);
    setTimeout(()=>{ clearInterval(iv);
      const f=window.__TORI.dbg.frameCount()-f0, t=performance.now()-t0;
      res({fps:+(f/(t/1000)).toFixed(1), en:+(sum/k).toFixed(1)}); }, s);
  }), ms);
}
(async()=>{
  const b=await chromium.launch(['--disable-gpu-vsync']);
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  p.on('pageerror',e=>console.log('  ❌ '+e.message));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(n=>{ window.__N=n; }, N);
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1000);
  console.log('  화질 잠금 :', JSON.stringify(await p.evaluate(()=>window.__TORI.dbg.perfPin(1))), ` · 몬스터 ${N}마리 유지`);
  await p.evaluate(()=>window.__TORI.dbg.animMode(1)); await win(p,2000);   /* 워밍업 */
  const R={0:[],1:[]}, E={0:[],1:[]};
  for(let r=0;r<ROUNDS;r++){
    for(const m of (r%2? [1,0] : [0,1])){        /* 순서도 번갈아 — 시간 드리프트 제거 */
      await p.evaluate(x=>window.__TORI.dbg.animMode(x), m);
      await p.waitForTimeout(300);
      const w=await win(p,SEC*1000);
      R[m].push(w.fps); E[m].push(w.en);
    }
  }
  const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
  console.log('\n── 중앙값 ('+ROUNDS+'회차 × '+SEC+'초) ──');
  for(const m of [0,1]) console.log(`  ${LBL[m].padEnd(14)} ${med(R[m]).toFixed(1)} fps · 평균 적 ${med(E[m])}마리   [${R[m].join(', ')}]`);
  const d=med(R[1])-med(R[0]);
  console.log(`\n  애니메이션 비용 : ${d>=0?'+':''}${d.toFixed(1)} fps  (${(d/med(R[0])*100).toFixed(1)}%)`);
  console.log(`  판정 : ${Math.abs(d)<=med(R[0])*0.04? '✅ 손실 4% 이내 — 사실상 공짜' : (d<0?'❌ 손실 있음':'✅ 이득')}`);
  await b.close();
})();
