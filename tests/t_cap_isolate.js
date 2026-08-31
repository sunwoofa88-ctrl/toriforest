const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:1400},deviceScaleFactor:2});
  const errs=[];
  p.on('pageerror', e=>errs.push('pageerror: '+e.message));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(3500);

  const result = await p.evaluate(()=>{
    const T=window.__TORI;
    const out={};
    T.S.eq=T.S.eq||{};
    for(const k in T.S.eq){ delete T.S.eq[k]; }

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
    function findArmor(re){
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===1 && re.test(k) && (e.en|0)===0) return k; }
      return null;
    }

    // Test 1: bare body (no armor) + cap, nonzero elemental -> forces old overlay path
    T.eqSet('a', null);
    const capElem = findHead(/cap/, 'nonzero');
    T.S.eq[capElem]=1; T.eqSet('h', capElem);
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    out.bare_cap_elem = {key:capElem, data:T.SPR.hero.idle.toDataURL('image/png')};

    // Test 2: bare body + helm, nonzero elemental -> old overlay, known-good type
    const helmElem = findHead(/helm/, 'nonzero');
    T.S.eq[helmElem]=1; T.eqSet('h', helmElem);
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    out.bare_helm_elem = {key:helmElem, data:T.SPR.hero.idle.toDataURL('image/png')};

    // Test 3: plate armor + helm (en=0 both) -> old overlay (no combo art for plate)
    const plateKey = findArmor(/plate/);
    const helmZero = findHead(/helm/, 'zero');
    T.S.eq[plateKey]=1; T.eqSet('a', plateKey);
    T.S.eq[helmZero]=1; T.eqSet('h', helmZero);
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    out.plate_helm = {keys:{plateKey,helmZero}, data:T.SPR.hero.idle.toDataURL('image/png')};

    return out;
  });

  const fs=require('fs');
  const path=require('path');
  const dir='/tmp/cap_isolate';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  for(const k in result){
    const b64=result[k].data.split(',')[1];
    fs.writeFileSync(path.join(dir, k+'.png'), Buffer.from(b64,'base64'));
  }
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([k,v])=>[k, v.key||v.keys])),null,2));
  console.log('ERRORS:', errs.length?JSON.stringify(errs):'none');
  await b.close();
})();
