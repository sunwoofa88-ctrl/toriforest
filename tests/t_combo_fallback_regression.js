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

  const result = await p.evaluate(()=>{
    const T=window.__TORI;
    const out={};

    function findArmor(re, elemRequire){
      for(const k in T.EQUIP){
        const e=T.EQUIP[k];
        if(e.slot===1 && re.test(k)){
          if(elemRequire==='nonzero' && (e.en|0)===0) continue;
          if(elemRequire==='zero' && (e.en|0)!==0) continue;
          return k;
        }
      }
      return null;
    }
    function findHead(re, elemRequire){
      for(const k in T.EQUIP){
        const e=T.EQUIP[k];
        if(e.slot===2 && re.test(k)){
          if(elemRequire==='nonzero' && (e.en|0)===0) continue;
          if(elemRequire==='zero' && (e.en|0)!==0) continue;
          return k;
        }
      }
      return null;
    }

    T.S.eq=T.S.eq||{};
    for(const k in T.S.eq){ delete T.S.eq[k]; }

    // Case A: plate armor (non-representative class) + cap headgear, both en=0
    // should fall back to old overlay (no hero_plate_cap.webp exists)
    const plateKey = findArmor(/plate|armor/, null) || findArmor(/./, null);
    const capKey0 = findHead(/cap/, 'zero');
    out.caseA_keys = {plateKey, capKey0};
    if(plateKey && capKey0){
      T.S.eq[plateKey]=1; T.eqSet('a', plateKey);
      T.S.eq[capKey0]=1; T.eqSet('h', capKey0);
      if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
      const c=T.SPR.hero.idle;
      out.caseA={w:c.width,h:c.height,data:c.toDataURL('image/png')};
    }

    // Case B: light armor (en=0) + cap headgear with NONZERO elemental (en!=0)
    // should fall back to old hue-rotate overlay even though armor class is 'light'
    let lightKey=null;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===1 && /light|vest/.test(k) && (e.en|0)===0){ lightKey=k; break; } }
    const capElem = findHead(/cap/, 'nonzero');
    out.caseB_keys = {lightKey, capElem};
    if(lightKey && capElem){
      T.S.eq[lightKey]=1; T.eqSet('a', lightKey);
      T.S.eq[capElem]=1; T.eqSet('h', capElem);
      if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
      const c=T.SPR.hero.idle;
      out.caseB={w:c.width,h:c.height,data:c.toDataURL('image/png')};
    }

    // Case C: weapon pose still renders on top (representative combo: bare + helm + a weapon)
    T.eqSet('a', null);
    const headKey=findHead(/helm/,'zero');
    T.S.eq[headKey]=1; T.eqSet('h', headKey);
    let weaponKey=null;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0){ weaponKey=k; break; } }
    out.caseC_keys={headKey, weaponKey};
    if(weaponKey){
      T.S.eq[weaponKey]=1; T.eqSet('w', weaponKey);
      if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
      const c=T.SPR.hero.idle;
      out.caseC={w:c.width,h:c.height,data:c.toDataURL('image/png')};
    }

    return out;
  });

  const fs=require('fs');
  const path=require('path');
  const dir='/tmp/combo_regress';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  const meta={};
  for(const k of ['caseA','caseB','caseC']){
    if(result[k] && result[k].data){
      const b64=result[k].data.split(',')[1];
      fs.writeFileSync(path.join(dir, k+'.png'), Buffer.from(b64,'base64'));
      meta[k]={w:result[k].w,h:result[k].h};
    } else {
      meta[k]='MISSING (keys not found: '+JSON.stringify(result[k+'_keys'])+')';
    }
  }
  console.log('keys:', JSON.stringify({A:result.caseA_keys,B:result.caseB_keys,C:result.caseC_keys},null,2));
  console.log('meta:', JSON.stringify(meta,null,2));
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit(errs.length? 1 : 0);
})();
