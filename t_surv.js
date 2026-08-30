/* 생존성 : 몬스터가 많아진 뒤 7살이 얼마나 자주 죽는가.
   '못하는 아이' 흉내 — 회피 안 함, 체력 낮아도 계속 돌진 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,mobLots,dodge,label){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(v=>{ window.__TORI.S.mobLots=v; window.__TORI.beginPlay(); }, mobLots);
  await p.waitForTimeout(1200);
  const r=await p.evaluate(d=>new Promise(res=>{
    const T=window.__TORI, P=T.P;
    let deaths=0,last=false,hpS=0,hpN=0,hpMin=1,hits=0,lastHp=1;
    const k0=T.dbg.prog().kills, t0=performance.now();
    const iv=setInterval(()=>{
      try{
        if(P.dead){ if(!last){deaths++;last=true;} return; } last=false;
        const hr=T.dbg.hpRatio(); hpS+=hr; hpN++; if(hr<hpMin)hpMin=hr;
        if(hr<lastHp-0.001) hits++; lastHp=hr;
        let g=null,gd=1e9;
        for(const e of T.EN){ if(!e.alive||e.dead) continue;
          const q=Math.hypot(e.x-P.x,e.y-P.y); if(q<gd){gd=q;g=e;} }
        if(g){ const a=Math.atan2(g.y-P.y,g.x-P.x);
          const fl = d && hr<0.35;
          const a2 = fl? a+Math.PI : a;
          P.x+=Math.cos(a2)*6; P.y+=Math.sin(a2)*4.2;
          P.fx=Math.cos(a); P.fy=Math.sin(a);
          if(gd<300) T.doAttack(g.x,g.y-g.size*0.5); }
      }catch(e){}
    },80);
    setTimeout(()=>{ clearInterval(iv);
      res({ deaths, hitsTaken:hits, hpAvg:+(hpS/Math.max(1,hpN)).toFixed(2), hpMin:+hpMin.toFixed(2),
            kills:T.dbg.prog().kills-k0, lv:T.S.lv, secs:Math.round((performance.now()-t0)/1000),
            alive:T.EN.filter(e=>e.alive&&!e.dead).length });
    },70000);
  }),dodge);
  r.label=label; r.err=errs.slice(0,2);
  await p.close(); return r;
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
  for(const [m,d,l] of [[1,true,'보통 · 피할 줄 앎'],[2,false,'아주많이 · 못 피함(최악)']])
    console.log(JSON.stringify(await run(b,m,d,l)));
  await b.close();
})();
