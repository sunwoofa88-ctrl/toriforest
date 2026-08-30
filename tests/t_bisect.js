const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--disable-gpu-vsync','--no-sandbox']});
async function run(setup,label){
  const out=[];
  for(let k=0;k<2;k++){
    const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
    await p.evaluate(()=>window.__TORI.beginPlay());
    await p.waitForTimeout(800);
    await p.evaluate(setup);
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.S.chap=44;T.enterChapter(44);
      for(let i=0;i<16;i++)T.spawnEnemy();});
    await p.waitForTimeout(700);
    await p.evaluate(()=>{const T=window.__TORI;T.S.ult=100;T.doUlt();});
    const r=await p.evaluate(async()=>{let n=0;const t0=performance.now();
      await new Promise(res=>{(function L(){n++;if(performance.now()-t0>=2000)return res();requestAnimationFrame(L);})();});
      return Math.round(n/((performance.now()-t0)/1000));});
    out.push(r); await p.close();
  }
  console.log(label.padEnd(30), out.join(' / '));
}
await run(()=>{}, '기준(현재)');
await run(()=>{ const d=window.__TORI.dbg; d.noShake&&d.noShake(); }, '흔들림 끔');
await run(()=>{ const d=window.__TORI.dbg; d.noStop&&d.noStop(); }, '히트스톱 끔');
await run(()=>{ const d=window.__TORI.dbg; d.noAdd&&d.noAdd(); }, '가산이펙트 끔');
await run(()=>{ const d=window.__TORI.dbg; d.noPart&&d.noPart(); }, '파티클 끔');
await b.close();})();
