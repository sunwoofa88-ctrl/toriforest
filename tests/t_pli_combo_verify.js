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
  await p.waitForTimeout(2000);

  const classes=['plate','mage','scale','royal','dark','light'];
  const heads=['h_cap','h_helm','h_hornh','h_hoodh','h_mask','h_crownh'];
  const elems=['pumpkin','light','ice'];

  let missing=[];
  let details={};
  let comboUsedCount=0, comboMissingCount=0;

  for(const elem of elems){
    const armorKeys = await p.evaluate(({classes,elem})=>{
      const T=window.__TORI;
      const out={};
      function findArmorForClass(cls){
        for(const k in T.EQUIP){
          const e=T.EQUIP[k];
          if(e.slot!==1) continue;
          if(!k.endsWith('_'+elem)) continue;
          if(T.__armCls(e)===cls) return k;
        }
        return null;
      }
      for(const cls of classes) out[cls]=findArmorForClass(cls);
      return out;
    }, {classes, elem});

    for(const cls of classes){
      const armorKey = armorKeys[cls];
      if(!armorKey){ missing.push('armor:'+cls+'_'+elem); continue; }
      await p.evaluate(({armorKey})=>{
        const T=window.__TORI;
        T.S.eq=T.S.eq||{};
        T.S.eq[armorKey]=1; T.eqSet('a', armorKey);
      }, {armorKey});
      await p.waitForTimeout(60);

      for(const hpref of heads){
        const hid = hpref+'_'+elem;
        const exists = await p.evaluate((hid)=>{ const T=window.__TORI; return !!T.EQUIP[hid]; }, hid);
        if(!exists){ missing.push('head:'+hid); continue; }

        const r = await p.evaluate(({hid, cls, elem})=>{
          const T=window.__TORI;
          T.S.eq[hid]=1; T.eqSet('h', hid);
          if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
          var headType = hid.split('_')[1];
          var comboKey = 'hero_' + cls + '_' + headType + '_' + elem;
          var resolved = T.artOf(comboKey);
          return {hid, comboKey, comboResolved: !!resolved};
        }, {hid, cls, elem});
        await p.waitForTimeout(60);

        const key = elem+'_'+cls+'_'+hid;
        details[key]={comboKey:r.comboKey, comboResolved:r.comboResolved};
        if(r.comboResolved) comboUsedCount++; else comboMissingCount++;
      }
    }
  }

  const total = elems.length*classes.length*heads.length;
  console.log('captured:', Object.keys(details).length, '/', total);
  console.log('comboResolved:', comboUsedCount, '/', total, '  (comboMissing:', comboMissingCount, ')');
  if(missing.length) console.log('MISSING:', JSON.stringify(missing));
  if(comboMissingCount>0){
    const bad = Object.entries(details).filter(([k,v])=>!v.comboResolved).map(([k,v])=>k+':'+v.comboKey);
    console.log('UNRESOLVED COMBOS:', JSON.stringify(bad));
  }
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit((errs.length || missing.length || comboMissingCount>0 || Object.keys(details).length!==total)? 1 : 0);
})();
