const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:1400},deviceScaleFactor:2});
  const errs=[];
  p.on('pageerror', e=>errs.push('pageerror: '+e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push('console.error: '+m.text()); });
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(3500);

  // Find dark armor key
  const armorKey = await p.evaluate(()=>{
    const T=window.__TORI;
    for(const k in T.EQUIP){
      const e=T.EQUIP[k];
      if(e.slot===1 && (e.en|0)===0 && T.__armCls(e)==='dark') return k;
    }
    return null;
  });
  console.log('armorKey:', armorKey);

  await p.evaluate(({armorKey})=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{};
    T.S.eq[armorKey]=1;
    const r = T.eqSet('a', armorKey);
    console.log('[page] eqSet a result:', r);
  }, {armorKey});
  await p.waitForTimeout(150);

  const heads=['h_cap_acorn','h_helm_acorn','h_hornh_acorn','h_hoodh_acorn','h_mask_acorn','h_crownh_acorn'];
  for(const hid of heads){
    const debug = await p.evaluate(({hid})=>{
      const T=window.__TORI;
      T.S.eq[hid]=1;
      const setResult = T.eqSet('h', hid);
      if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
      // read what's actually equipped now
      const aId = T.S.eqOn ? T.S.eqOn.a : undefined;
      const hId = T.S.eqOn ? T.S.eqOn.h : undefined;
      const eA = T.EQUIP[aId];
      const eH = T.EQUIP[hId];
      const armCls = eA ? T.__armCls(eA) : null;
      return {
        setResult, aId, hId,
        armCls,
        eH_tn: eH? eH.tn : null,
        eH_en: eH? eH.en : null
      };
    }, {hid});
    console.log('requested head:', hid, '-> debug:', JSON.stringify(debug));
  }

  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit(0);
})();
