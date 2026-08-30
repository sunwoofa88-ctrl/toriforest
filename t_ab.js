/* A/B : 같은 조건에서 두 빌드의 프레임 시간을 나란히 잰다 (vsync 끔 = 진짜 처리량) */
const {chromium}=require('playwright');
const FILES=process.argv.slice(2);
(async()=>{
const b=await chromium.launch({args:['--disable-gpu-vsync','--disable-frame-rate-limit','--no-sandbox']});
for(const f of FILES){
  const out={};
  for(const R of [1,2,3]){
    const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+f);
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
    await p.evaluate(()=>window.__TORI.beginPlay());
    await p.waitForTimeout(1000);
    const stat=async(ms)=>p.evaluate(async ms=>{
      const d=[];let prev=0,st=0;
      await new Promise(res=>{(function L(t){ if(!st){st=t;prev=t;requestAnimationFrame(L);return;}
        d.push(t-prev);prev=t; if(t-st>=ms)return res(); requestAnimationFrame(L);})(performance.now());});
      const s=d.slice().sort((a,c)=>a-c),q=f=>+s[Math.min(s.length-1,Math.floor(s.length*f))].toFixed(2);
      return {fps:Math.round(1000/(d.reduce((a,c)=>a+c,0)/d.length)),p50:q(.5),p95:q(.95),p99:q(.99)};
    },ms);
    const idle=await stat(1500);
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.S.chap=44;T.enterChapter(44);
      for(let i=0;i<16;i++)T.spawnEnemy();});
    await p.waitForTimeout(700);
    await p.evaluate(()=>{const T=window.__TORI;T.S.ult=100;T.doUlt();});
    const fight=await stat(2200);
    (out.idle=out.idle||[]).push(idle.p50); (out.f50=out.f50||[]).push(fight.p50);
    (out.f95=out.f95||[]).push(fight.p95); (out.f99=out.f99||[]).push(fight.p99);
    (out.ffps=out.ffps||[]).push(fight.fps);
    if(errs.length)console.log('  ERR',errs.slice(0,2));
    await p.close();
  }
  const med=a=>a.slice().sort((x,y)=>x-y)[1];
  console.log(`${f.padEnd(22)}  평상p50 ${med(out.idle).toFixed(1)}ms | 전투 ${med(out.ffps)}fps  p50 ${med(out.f50).toFixed(1)}  p95 ${med(out.f95).toFixed(1)}  p99 ${med(out.f99).toFixed(1)}ms`);
}
await b.close();
})();
