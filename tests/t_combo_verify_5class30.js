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

  const classes=['plate','mage','scale','royal','dark'];
  const heads=['h_cap_acorn','h_helm_acorn','h_hornh_acorn','h_hoodh_acorn','h_mask_acorn','h_crownh_acorn'];

  // find one armor key per class, once
  const armorKeys = await p.evaluate(({classes})=>{
    const T=window.__TORI;
    const out={};
    function findArmorForClass(cls){
      for(const k in T.EQUIP){
        const e=T.EQUIP[k];
        if(e.slot!==1) continue;
        if((e.en|0)!==0) continue;
        if(T.__armCls(e)===cls) return k;
      }
      return null;
    }
    for(const cls of classes) out[cls]=findArmorForClass(cls);
    return out;
  }, {classes});

  const fs=require('fs');
  const path=require('path');
  const dir='/tmp/combo_verify_5class30';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  let missing=[];
  let sizes={};

  for(const cls of classes){
    const armorKey = armorKeys[cls];
    if(!armorKey){ missing.push(cls); continue; }
    // set armor, isolated call + settle
    await p.evaluate(({armorKey})=>{
      const T=window.__TORI;
      T.S.eq=T.S.eq||{};
      T.S.eq[armorKey]=1; T.eqSet('a', armorKey);
    }, {armorKey});
    await p.waitForTimeout(80);

    for(const hid of heads){
      // set head, isolated call + settle
      await p.evaluate(({hid})=>{
        const T=window.__TORI;
        T.S.eq[hid]=1; T.eqSet('h', hid);
        if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
      }, {hid});
      await p.waitForTimeout(80);

      // capture, separate call
      const shot = await p.evaluate(()=>{
        const T=window.__TORI;
        const c=T.SPR.hero.idle;
        return {w:c.width, h:c.height, data:c.toDataURL('image/png')};
      });
      const key = cls+'_'+hid;
      const b64=shot.data.split(',')[1];
      fs.writeFileSync(path.join(dir, key+'.png'), Buffer.from(b64,'base64'));
      sizes[key]=shot.w+'x'+shot.h+' ('+armorKey+')';
    }
  }

  console.log('combos captured:', Object.keys(sizes).length, '/ 30');
  console.log('sizes:', JSON.stringify(sizes, null, 1));
  if(missing.length) console.log('MISSING CLASSES:', JSON.stringify(missing));
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit((errs.length || missing.length || Object.keys(sizes).length!==30)? 1 : 0);
})();
