const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,chap,mobLots,label){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(([c,v])=>{ const T=window.__TORI;
    T.S.mobLots=v; T.S.lv=Math.max(1,Math.round(c*1.6)+3); T.S.chap=c;
    T.S.tier=T.S.tier||{}; T.S.tier[T.S.abil]=Math.min(2,Math.floor(c/34));
    T.S.plus=T.S.plus||{}; T.S.plus[T.S.abil]=Math.min(20,Math.floor(c*0.4));
    T.beginPlay(); try{T.enterChapter(c);}catch(e){}
  },[chap,mobLots]);
  await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>new Promise(res=>{
    const T=window.__TORI,P=T.P;
    let deaths=0,last=false,hpS=0,hpN=0,hpMin=1,hits=0,lastHp=1;
    const k0=T.dbg.prog().kills;
    const iv=setInterval(()=>{ try{
      if(P.dead){ if(!last){deaths++;last=true;} return;} last=false;
      const hr=T.dbg.hpRatio(); hpS+=hr;hpN++; if(hr<hpMin)hpMin=hr;
      if(hr<lastHp-0.001) hits++; lastHp=hr;
      let g=null,gd=1e9;
      for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-P.x,e.y-P.y);if(q<gd){gd=q;g=e;}}
      if(g){const a=Math.atan2(g.y-P.y,g.x-P.x);P.x+=Math.cos(a)*6;P.y+=Math.sin(a)*4.2;P.fx=Math.cos(a);P.fy=Math.sin(a);
        if(gd<300)T.doAttack(g.x,g.y-g.size*0.5);}
    }catch(e){} },80);
    setTimeout(()=>{clearInterval(iv);res({deaths,hitsTaken:hits,hpAvg:+(hpS/Math.max(1,hpN)).toFixed(2),
      hpMin:+hpMin.toFixed(2),kills:T.dbg.prog().kills-k0,chap:T.S.chap,lv:T.S.lv,
      alive:T.EN.filter(e=>e.alive&&!e.dead).length});},48000);
  }));
  r.label=label; await p.close(); return r;
}
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
  for(const [c,m,l] of [[40,2,'40장 · 아주많이 · 못피함'],[75,2,'75장 · 아주많이 · 못피함']])
    console.log(JSON.stringify(await run(b,c,m,l)));
  await b.close(); })();
