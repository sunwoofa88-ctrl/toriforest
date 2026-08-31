/* 맨몸 vs 장착 캐릭터 실제 렌더 크기 비교 — 사용자 제보 확인용 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:700},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(2500);

  // 1) 맨몸(장비 전부 해제)
  await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    T.EN.length=0; T.P.moving=false; T.P.atkT=0;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
  });
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await p.screenshot({path:'/tmp/size_bare.png',clip:{x:200,y:150,width:300,height:300}});

  // 2) 갑옷 장착 (light)
  const armorId=await p.evaluate(()=>{
    const T=window.__TORI;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===1){ T.S.eq[k]=1; T.eqSet('a',k); return k; } }
    return null;
  });
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await p.screenshot({path:'/tmp/size_geared.png',clip:{x:200,y:150,width:300,height:300}});
  console.log('armorId=',armorId);
  await b.close();
})();
