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

  const heads=['h_cap_acorn','h_helm_acorn','h_hornh_acorn','h_hoodh_acorn','h_mask_acorn','h_crownh_acorn'];

  const result = await p.evaluate((heads)=>{
    const T=window.__TORI;
    const out={};

    function findLightArmor(){
      for(const k in T.EQUIP){
        const e=T.EQUIP[k];
        if(e.slot===1 && /light|vest/.test(k) && (e.en|0)===0) return k;
      }
      return null;
    }
    const lightKey = findLightArmor();

    // bare + each head
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    for(const k in T.S.eq){ delete T.S.eq[k]; }
    for(const hid of heads){
      T.S.eq[hid]=1; T.eqSet('h',hid);
      if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
      const c=T.SPR.hero.idle;
      out['bare_'+hid]={w:c.width,h:c.height,data:c.toDataURL('image/png')};
    }

    // light armor + each head
    if(lightKey){
      T.S.eq[lightKey]=1; T.eqSet('a',lightKey);
      for(const hid of heads){
        T.S.eq[hid]=1; T.eqSet('h',hid);
        if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
        const c=T.SPR.hero.idle;
        out['light_'+hid]={w:c.width,h:c.height,data:c.toDataURL('image/png')};
      }
    } else {
      out['__lightKeyMissing']=true;
    }
    out['__lightKey']=lightKey;
    return out;
  }, heads);

  const fs=require('fs');
  const path=require('path');
  const dir='/tmp/combo_verify';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  for(const k in result){
    if(k.startsWith('__')) continue;
    const b64=result[k].data.split(',')[1];
    fs.writeFileSync(path.join(dir, k+'.png'), Buffer.from(b64,'base64'));
  }
  console.log('lightKey used:', result.__lightKey);
  console.log('sizes:', Object.fromEntries(Object.entries(result).filter(([k])=>!k.startsWith('__')).map(([k,v])=>[k, v.w+'x'+v.h])));
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit(errs.length? 1 : 0);
})();
