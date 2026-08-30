/* 공격 이펙트 화면 점유 + 몬스터 접근성 동시 측정 (ATK_FXS 값을 바꿔 가며 A/B) */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function run(b,fxs,label){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  if(fxs!==null) await p.evaluate(v=>window.__TORI.dbg.setAtkFxs(v), fxs);
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>new Promise(res=>{
    const T=window.__TORI;
    let mSlash=0,mWave=0,mRing=0, areaS=0,areaN=0, cut0=T.dbg.aqStat().cut;
    const dist=[], near=[];
    const iv=setInterval(()=>{
      try{
        // 계속 공격
        let tgt=null,bd=1e9;
        for(const e of T.EN){ if(!e.alive||e.dead) continue;
          const d=Math.hypot(e.x-T.P.x,e.y-T.P.y); if(d<bd){bd=d;tgt=e;} }
        if(tgt) T.doAttack(tgt.x,tgt.y-tgt.size*0.5);
        for(const q of T.dbg.PR){ if(!q.alive) continue;
          if(q.kind==='fx_slash') mSlash=Math.max(mSlash,q.r);
          if(q.kind==='fx_wave')  mWave =Math.max(mWave ,q.r);
          if(q.kind==='fx_ring')  mRing =Math.max(mRing ,q.r); }
        const a=T.dbg.aqStat(); areaS+=a.area; areaN++;
        let n=0; for(const e of T.EN){ if(!e.alive||e.dead) continue;
          if(Math.hypot(e.x-T.P.x,e.y-T.P.y)<900) n++; }
        if(bd<1e9){ dist.push(Math.round(bd)); near.push(n); }
      }catch(e){}
    },90);
    setTimeout(()=>{ clearInterval(iv);
      dist.sort((a,b)=>a-b);
      res({ maxSlashR:Math.round(mSlash), maxWaveR:Math.round(mWave), maxRingR:Math.round(mRing),
        drawW:Math.round(Math.min(mSlash*(0.52+0.66),205*window.innerWidth/1024*T.SC*T.dbg.aqStat().atkFxs)*2),
        avgAddArea:Math.round(areaS/Math.max(1,areaN)),
        scrArea:innerWidth*innerHeight,
        cut:T.dbg.aqStat().cut-cut0,
        distMed:dist[Math.floor(dist.length/2)]|0, distP90:dist[Math.floor(dist.length*0.9)]|0, distMax:dist[dist.length-1]|0,
        nearAvg:+(near.reduce((a,c)=>a+c,0)/Math.max(1,near.length)).toFixed(1),
        nearMin:Math.min.apply(null,near), nearMax:Math.max.apply(null,near),
        kills:T.dbg.prog().kills, alive:T.EN.filter(e=>e.alive&&!e.dead).length,
        atkFxs:T.dbg.aqStat().atkFxs });
    },24000);
  }));
  r.label=label; r.errs=errs.slice(0,3);
  await p.close();
  return r;
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
  const now=await run(b,null,'현재(0.50)');
  const old=await run(b,1.0,'예전(1.00)');
  console.log(JSON.stringify([old,now],null,1));
  const rel=(now.avgAddArea/Math.max(1,old.avgAddArea));
  console.log('\n가산합성 면적비 (지금/예전) = '+rel.toFixed(3));
  console.log('슬래시 반경비              = '+(now.maxSlashR/Math.max(1,old.maxSlashR)).toFixed(3));
  await b.close();
})();
