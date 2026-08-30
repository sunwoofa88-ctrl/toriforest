/* 필살기 4단계 연출 전수 검증 : 무기 12종. 프레임당 캔버스 명령 수 · NaN · 오류를 함께 본다.
   "이펙트 크면 렉" — 그래서 명령 수 상한을 두고 넘으면 FAIL 로 잡는다. */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const WT=['sword','great','dagger','katana','axe','hammer','spear','scythe','bow','staff','claw','boomer'];
const CALL_CAP=2600;   /* A9+ 기준 안전선 (평상시 340~1100, 전투 최대치 대비 여유) */
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts.g/.test(m.text()))errs.push(m.text());});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(800);
  let bad=0;
  for(const w of WT){
    const r=await p.evaluate(async(wt)=>{
      const T=window.__TORI;
      /* 이 무기를 실제로 장착시켜 필살기 종류를 바꾼다 */
      let found=null;
      for(const id of T.EQ_IDS){ const E=T.EQUIP[id];
        if(E && T.WEP_TYPE[E.tn] && T.WEP_TYPE[E.tn].id===wt){ found=id; break; } }
      if(found){ T.giveEquip(found); T.S.eqW=found; T.refreshHeroArt&&T.refreshHeroArt(); }
      T.S.ult=100;
      /* 캔버스 명령 계측 */
      const C=CanvasRenderingContext2D.prototype;
      const names=['drawImage','fill','stroke','fillRect','fillText','save','restore',
                   'setTransform','translate','rotate','scale','beginPath','ellipse','arc',
                   'moveTo','lineTo','clip','createRadialGradient','createLinearGradient'];
      const cnt={}, orig={};
      for(const n of names){ orig[n]=C[n]; cnt[n]=0;
        C[n]=function(){ cnt[n]++; return orig[n].apply(this,arguments); }; }
      const f0=T.dbg.frameCount();
      T.doUlt();
      await new Promise(res=>setTimeout(res,2500));
      const frames=T.dbg.frameCount()-f0;
      for(const n in orig) C[n]=orig[n];
      let tot=0; for(const n in cnt) tot+=cnt[n];
      let nan=0;
      for(const q of T.dbg.PR){ if(!q.alive) continue;
        if(!isFinite(q.x)||!isFinite(q.y)||!isFinite(q.r)) nan++; }
      if(!isFinite(T.P.x)||!isFinite(T.P.y)) nan++;
      return {perFrame:Math.round(tot/Math.max(1,frames)), frames, nan,
              on:T.ultFxOn(), fps:Math.round(frames/2.5), wep:found||'(기본)'};
    }, w);
    const ok = r.nan===0 && r.perFrame<=CALL_CAP && r.frames>60;
    if(!ok) bad++;
    console.log(`${w.padEnd(7)} ${String(r.wep).padEnd(14)} 프레임당명령 ${String(r.perFrame).padStart(5)} · ${String(r.fps).padStart(3)}fps · NaN=${r.nan} · ${r.on}  ${ok?'OK':'FAIL'}`);
    await p.waitForTimeout(600);
  }
  console.log('\n호출 상한:',CALL_CAP,'  에러:',errs.length, errs.slice(0,3));
  const pass=(bad===0&&errs.length===0);
  console.log(pass?'PASS':'FAIL ('+bad+'종)');
  await b.close(); process.exit(pass?0:1);
})();
