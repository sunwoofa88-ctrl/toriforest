const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:700},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(3500);

  const names=['가죽 모자','투구','뿔투구','두건','가면','왕관']; // guess Korean names; fallback to slot scan below
  const slotKeys=['h']; // head slot key
  const got=await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    const all=[];
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===2){ all.push(k); } }
    const prefixes=['h_cap_','h_helm_','h_hornh_','h_hoodh_','h_mask_','h_crownh_'];
    const found=[];
    for(const pre of prefixes){ const m=all.find(k=>k.startsWith(pre)); if(m) found.push(m); }
    return found.length? found : all.slice(0,6);
  });
  console.log('head equip ids found:', got.length, got.slice(0,20));

  for(const id of got){
    await p.evaluate((id)=>{
      const T=window.__TORI;
      T.S.eq[id]=1; T.eqSet('h',id);
    }, id);
    await p.waitForTimeout(900);
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await p.screenshot({path:`/tmp/barehead_${id}.png`,clip:{x:220,y:180,width:240,height:240}});
  }
  console.log('done');
  await b.close();
})();
