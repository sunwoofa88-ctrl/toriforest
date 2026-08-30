/* 스킬 4번(가장 큰 모션) 시전 순간을 같은 타이밍에 A/B 로 잡는다 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 for(const fxs of [1.0,0.5]){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:2});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{ const T=window.__TORI;
    T.S.lv=45; T.S.chap=10; T.beginPlay(); });
  await p.evaluate(v=>window.__TORI.dbg.setAtkFxs(v),fxs);
  await p.waitForTimeout(2000);
  await p.evaluate(()=>{ const T=window.__TORI;
    for(const e of T.EN) e.alive=false;          /* 화면 정리 */
    T.dbg.setRoam(0);
    for(let i=0;i<4;i++) T.spawnEnemy();
    for(const e of T.EN){ if(e.alive){ e.hp=e.hpMax=1e9; } }   /* 안 죽게 */
  });
  await p.waitForTimeout(600);
  // 스킬 4번 시전
  await p.evaluate(()=>{ const T=window.__TORI;
    const sk=T.dbg.curSkills? T.dbg.curSkills() : null;
    if(T.dbg.skillCastFX){
      const ang=0; T.dbg.skillCastFX('overhead','#4EC5FF',300,ang,3);
    } else if(sk&&sk[3]){ T.S.abil=sk[3].key; }
    let g=null,d=1e9;
    for(const e of T.EN){ if(!e.alive||e.dead)continue;
      const q=Math.hypot(e.x-T.P.x,e.y-T.P.y); if(q<d){d=q;g=e;} }
    if(g) T.doAttack(g.x,g.y-g.size*0.5);
  });
  for(const ms of [90,180,300]){
    await p.waitForTimeout(ms===90?90:90);
    await p.screenshot({path:`/root/toriforest/shots/s4_${fxs}_${ms}.png`});
  }
  await p.close();
 }
 await b.close(); console.log('ok');
})();
