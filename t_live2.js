/* 실제 전투 생존성 : 7살이 하는 수준(가끔 회피, 자주 공격)으로 90초 굴려 본다 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,mobLots,label){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(v=>{ window.__TORI.S.mobLots=v; window.__TORI.beginPlay(); }, mobLots);
  await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>new Promise(res=>{
    const T=window.__TORI, S=T.S, P=T.P;
    let deaths=0, hpMin=1, hpS=0, hpN=0, k0=T.dbg.prog().kills;
    let lastDead=false, t0=performance.now();
    const iv=setInterval(()=>{
      try{
        if(P.dead){ if(!lastDead){deaths++; lastDead=true;} } else lastDead=false;
        const hr=T.dbg.hpRatio(); hpS+=hr; hpN++; if(hr<hpMin)hpMin=hr;
        /* 7살 조작 흉내 : 가장 가까운 몬스터 쪽으로 걸어가며 때린다. 회피는 어설프게 */
        let tg=null,td=1e9;
        for(const e of T.EN){ if(!e.alive||e.dead) continue;
          const d=Math.hypot(e.x-P.x,e.y-P.y); if(d<td){td=d;tg=e;} }
        if(tg){
          const ang=Math.atan2(tg.y-P.y,tg.x-P.x);
          const flee = hr<0.3 && Math.random()<0.5;      /* 피 적으면 가끔 도망 */
          const a2 = flee? ang+Math.PI : ang;
          P.x+=Math.cos(a2)*(td>200?7:1.5); P.y+=Math.sin(a2)*(td>200?5:1);
          P.fx=Math.cos(ang); P.fy=Math.sin(ang);
          if(td<300) T.doAttack(tg.x,tg.y-tg.size*0.5);
        }
      }catch(e){}
    },80);
    setTimeout(()=>{ clearInterval(iv); res({
      deaths, secs:Math.round((performance.now()-t0)/1000),
      hpAvg:+(hpS/Math.max(1,hpN)).toFixed(2), hpMin:+hpMin.toFixed(2),
      kills:T.dbg.prog().kills-k0, lv:S.lv, chap:S.chap,
      alive:T.EN.filter(e=>e.alive&&!e.dead).length });
    },90000);
  }));
  r.label=label; r.err=errs.slice(0,2);
  await p.close(); return r;
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
  for(const [m,l] of [[0,'보통보다적게'],[1,'보통'],[2,'아주많이']])
    console.log(JSON.stringify(await run(b,m,l)));
  await b.close();
})();
