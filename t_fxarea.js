/* 스킬 이펙트가 화면을 얼마나 덮는지 + 프레임당 캔버스 명령 수 (A9+ 부담 지표) */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1340,height:848},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>new Promise(res=>{
    const T=window.__TORI;
    let maxSlash=0, maxAll=0, n=0, calls=0;
    const C=CanvasRenderingContext2D.prototype;
    const names=['drawImage','fill','stroke','fillRect','save','restore','setTransform','translate','rotate','scale','beginPath','arc'];
    const orig={}; for(const k of names){ orig[k]=C[k]; C[k]=function(){ calls++; return orig[k].apply(this,arguments); }; }
    const f0=T.dbg.frameCount();
    const iv=setInterval(()=>{
      let t=null,bd=1e9;
      for(const e of T.EN){ if(!e.alive||e.dead)continue;
        const d=Math.hypot(e.x-T.P.x,e.y-T.P.y); if(d<bd){bd=d;t=e;} }
      if(t) T.doAttack(t.x,t.y-t.size*0.5);
      for(const q of T.PT||[]){ if(!q||!q.alive) continue;
        if(q.size>maxAll) maxAll=q.size; }
      for(const q of T.dbg.PR){ if(!q.alive) continue;
        if(q.kind==='fx_slash' && q.r>maxSlash) maxSlash=q.r; }
      if(++n>=70){ clearInterval(iv);
        const frames=T.dbg.frameCount()-f0;
        for(const k of names) C[k]=orig[k];
        res({가장큰파티클:Math.round(maxAll), 프레임:frames,
             프레임당명령:Math.round(calls/Math.max(1,frames)),
             화면높이:T.dbg.uiSafe().H});
      }
    },28);
  }));
  console.log('가장 큰 이펙트 파티클:', r.가장큰파티클, 'px  (화면 높이', r.화면높이+'px, 점유', (r.가장큰파티클/r.화면높이*100).toFixed(1)+'%)');
  console.log('프레임당 캔버스 명령:', r.프레임당명령);
  console.log('오류:', errs.length);
  const ok = r.가장큰파티클 <= r.화면높이*0.45 && r.프레임당명령 <= 2600 && errs.length===0;
  console.log(ok?'PASS':'FAIL');
  await b.close(); process.exit(ok?0:1);
})();
