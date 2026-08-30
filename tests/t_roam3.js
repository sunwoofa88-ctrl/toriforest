/* 접근성 편차가 진짜인지 노이즈인지 — 같은 조건으로 4번 반복 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,seedN){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1400);
  const r=await p.evaluate(()=>new Promise(res=>{
    const T=window.__TORI, px=T.P.x, py=T.P.y;
    const onscr=[], dist=[];
    const iv=setInterval(()=>{ try{
      T.P.x=px; T.P.y=py; T.P.vx=0; T.P.vy=0;
      let bd=1e9,os=0;
      for(const e of T.EN){ if(!e.alive||e.dead) continue;
        const d=Math.hypot(e.x-px,e.y-py); if(d<bd)bd=d; if(d<520)os++; }
      onscr.push(os); if(bd<1e9) dist.push(Math.round(bd));
      let g=null,gd=1e9;
      for(const e of T.EN){ if(!e.alive||e.dead) continue;
        const d=Math.hypot(e.x-px,e.y-py); if(d<gd){gd=d;g=e;} }
      if(g&&gd<260) T.doAttack(g.x,g.y-g.size*0.5);
    }catch(e){} },100);
    setTimeout(()=>{ clearInterval(iv);
      const s=[...dist].sort((a,b)=>a-b);
      res({ empty:+(100*onscr.filter(v=>v===0).length/Math.max(1,onscr.length)).toFixed(1),
            onAvg:+(onscr.reduce((a,c)=>a+c,0)/Math.max(1,onscr.length)).toFixed(1),
            med:s[s.length>>1]|0, kills:T.dbg.prog().kills });
    },22000);
  }));
  await p.close(); return r;
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
  const rs=[];
  for(let i=0;i<4;i++){ const r=await run(b,i); rs.push(r); console.log(`  ${i+1}회: 빈화면 ${r.empty}% · 화면안 평균 ${r.onAvg}마리 · 최근접중앙 ${r.med}px · 처치 ${r.kills}`); }
  const e=rs.map(r=>r.empty).sort((a,b)=>a-b);
  console.log(`\n빈화면 비율: 최소 ${e[0]}% · 중앙 ${e[2]}% · 최대 ${e[3]}%  (원래는 85%)`);
  await b.close();
})();
