const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:500,height:700},deviceScaleFactor:2});
  const errs=[];
  p.on('pageerror', e=>errs.push('pageerror: '+e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push('console.error: '+m.text()); });
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(3500);

  const r=await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    const out={};
    // bare + each headgear type
    const heads=['h_cap_acorn','h_helm_acorn','h_hornh_acorn','h_hoodh_acorn','h_mask_acorn','h_crownh_acorn'];
    for(const hid of heads){
      T.S.eq[hid]=1; T.eqSet('h',hid);
      if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
      out[hid]='ok:'+(T.SPR.hero.idle.width)+'x'+(T.SPR.hero.idle.height);
    }
    // now equip light armor too
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===1 && /light|vest/.test(k)){ T.S.eq[k]=1; T.eqSet('a',k); break; } }
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    out['geared']='ok:'+(T.SPR.hero.idle.width)+'x'+(T.SPR.hero.idle.height);
    return out;
  });
  console.log(JSON.stringify(r,null,2));
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await p.screenshot({path:'/tmp/combo_smoke.png'});
  await b.close();
  process.exit(errs.length? 1 : 0);
})();
