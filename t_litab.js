/* 조명 켬/끔 A/B — 무엇이 프레임을 먹는지 확정 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,lit,label){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
  await p.addInitScript(v=>{try{
    const k='toriforest_save_v5';
    const o=JSON.parse(localStorage.getItem(k)||'{}'); o.lit=v; localStorage.setItem(k,JSON.stringify(o));
  }catch(e){}}, lit);
  const t0=Date.now();
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  const boot=Date.now()-t0;
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
  await p.waitForTimeout(2200);
  await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<34;i++)T.spawnEnemy();
    window.__a=setInterval(()=>{let g=null,d=1e9;
      for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
      if(g)T.doAttack(g.x,g.y-g.size*0.5);},130);});
  await p.waitForTimeout(1400);
  const r=await p.evaluate(()=>new Promise(res=>{
    let n=0,t=performance.now(),last=t,fr=[];
    function tick(){const c=performance.now();fr.push(c-last);last=c;n++;
      if(c-t<6000) requestAnimationFrame(tick);
      else{fr.sort((a,b)=>a-b);res({fps:Math.round(n/((c-t)/1000)),p50:+fr[fr.length>>1].toFixed(1),
        p95:+fr[Math.floor(fr.length*.95)].toFixed(1),
        en:window.__TORI.EN.filter(e=>e.alive&&!e.dead).length});}
    } requestAnimationFrame(tick);
  }));
  console.log(`${label.padEnd(14)} 부팅 ${String(boot).padStart(5)}ms · 전투 ${String(r.fps).padStart(3)}fps · p50 ${String(r.p50).padStart(5)}ms · p95 ${String(r.p95).padStart(6)}ms · 적${r.en}`);
  await p.close(); return r;
}
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 await run(b,0,'조명 끔');
 await run(b,1,'조명 켬');
 await b.close();
})();
