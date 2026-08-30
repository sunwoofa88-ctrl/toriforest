/* 전투 프레임 원인 분해 : 무엇이 프레임을 먹는가 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function scene(p,fn,secs){
  await p.evaluate(fn);
  return await p.evaluate(s=>new Promise(res=>{
    let n=0,t0=performance.now(),fr=[],last=t0;
    function tick(){ const t=performance.now(); fr.push(t-last); last=t; n++;
      if(t-t0<s*1000) requestAnimationFrame(tick);
      else { fr.sort((a,b)=>a-b);
        res({ fps:Math.round(n/((t-t0)/1000)),
              p50:+fr[fr.length>>1].toFixed(1), p95:+fr[Math.floor(fr.length*0.95)].toFixed(1),
              worst:+fr[fr.length-1].toFixed(1),
              aq:window.__TORI.dbg.aqStat(), pt:window.__TORI.particleCount(),
              en:window.__TORI.EN.filter(e=>e.alive&&!e.dead).length }); }
    } requestAnimationFrame(tick);
  }),secs);
}
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 await p.goto(F);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>window.__TORI.beginPlay());
 await p.waitForTimeout(1200);
 const R={};
 R['A 빈 필드(적 제거)'] = await scene(p,()=>{const T=window.__TORI;T.dbg.setRoam(0);for(const e of T.EN){e.alive=false;}},4);
 R['B 적16 · 공격없음'] = await scene(p,()=>{const T=window.__TORI;for(let i=0;i<16;i++)T.spawnEnemy();},4);
 R['C 적16 · 계속공격'] = await scene(p,()=>{const T=window.__TORI;window.__atk=setInterval(()=>{let g=null,d=1e9;for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}if(g)T.doAttack(g.x,g.y);},110);},5);
 R['D 적16 · 공격 + 필살기'] = await scene(p,()=>{const T=window.__TORI;T.S.ult=100;T.doUlt();},3);
 await p.evaluate(()=>clearInterval(window.__atk));
 await p.waitForTimeout(1500);
 R['E 적40 · 계속공격'] = await scene(p,()=>{const T=window.__TORI;for(let i=0;i<26;i++)T.spawnEnemy();window.__atk=setInterval(()=>{let g=null,d=1e9;for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}if(g)T.doAttack(g.x,g.y);},110);},5);
 for(const k in R){ const r=R[k];
   console.log(k.padEnd(22)+' fps='+String(r.fps).padStart(3)+
     '  p50='+String(r.p50).padStart(5)+'ms p95='+String(r.p95).padStart(6)+'ms 최악='+String(r.worst).padStart(6)+
     'ms | 적'+String(r.en).padStart(3)+' 파티클'+String(r.pt).padStart(4)+
     ' 가산면적'+String(Math.round(r.aq.area/1000)).padStart(5)+'k/'+Math.round(r.aq.soft/1000)+'k 컷'+r.aq.cut); }
 await b.close();
})();
