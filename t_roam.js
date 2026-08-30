/* "몬스터가 나한테 오는가" — 가만히 서 있을 때 근처 몬스터 수 / 최근접 거리 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,roam,aggro,label){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.evaluate(([r,a])=>{ window.__TORI.dbg.setRoam(r); window.__TORI.dbg.setAggro(a); },[roam,aggro]);
  await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>new Promise(res=>{
    const T=window.__TORI;
    // 플레이어 고정 : 가만히 서서 공격만 한다 (아이가 '찾아가지 않는' 상황)
    const px=T.P.x, py=T.P.y;
    const dist=[], near=[], onscr=[];
    let firstContact=-1, t0=performance.now();
    const iv=setInterval(()=>{
      try{
        T.P.x=px; T.P.y=py; T.P.vx=0; T.P.vy=0;
        let bd=1e9,n=0,os=0;
        for(const e of T.EN){ if(!e.alive||e.dead) continue;
          const d=Math.hypot(e.x-px,e.y-py);
          if(d<bd)bd=d; if(d<900)n++; if(d<520)os++; }
        if(bd<1e9){ dist.push(Math.round(bd)); near.push(n); onscr.push(os);
          if(firstContact<0 && bd<180) firstContact=+((performance.now()-t0)/1000).toFixed(1); }
        // 사거리 안이면 때린다
        let tg=null,td=1e9;
        for(const e of T.EN){ if(!e.alive||e.dead) continue;
          const d=Math.hypot(e.x-px,e.y-py); if(d<td){td=d;tg=e;} }
        if(tg&&td<260) T.doAttack(tg.x,tg.y-tg.size*0.5);
      }catch(e){}
    },100);
    setTimeout(()=>{ clearInterval(iv);
      const srt=[...dist].sort((a,b)=>a-b);
      const avg=a=>+(a.reduce((x,c)=>x+c,0)/Math.max(1,a.length)).toFixed(1);
      res({ distMed:srt[srt.length>>1]|0, distP90:srt[Math.floor(srt.length*0.9)]|0, distMax:srt[srt.length-1]|0,
            nearAvg:avg(near), nearMin:Math.min.apply(null,near),
            onScrAvg:avg(onscr), onScrMin:Math.min.apply(null,onscr),
            /* 한 화면(±520px) 안에 몬스터가 0마리인 시간 비율 = '찾으러 가야 하는' 시간 */
            emptyPct:+(100*onscr.filter(v=>v===0).length/Math.max(1,onscr.length)).toFixed(1),
            firstContact, kills:T.dbg.prog().kills, alive:T.EN.filter(e=>e.alive&&!e.dead).length });
    },26000);
  }));
  r.label=label; r.err=errs.length;
  await p.close(); return r;
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
  const out=[];
  out.push(await run(b,0,430/880,'스포너X · 인지 절반'));
  out.push(await run(b,0,1,      '스포너X · 인지 그대로'));
  out.push(await run(b,1,1,      '현재 (스포너O)'));
  for(const r of out) console.log(JSON.stringify(r));
  await b.close();
})();
