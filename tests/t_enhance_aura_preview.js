const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:400},deviceScaleFactor:2});
  const errs=[];
  p.on('pageerror', e=>errs.push('pageerror: '+e.message));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(3500);

  const result = await p.evaluate(()=>{
    const T=window.__TORI;
    let wKey=null;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0 && /sword/.test(k) && /fire/.test(k)){ wKey=k; break; } }
    if(!wKey){ for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0){ wKey=k; break; } } }
    const out={wKey, levels:{}};
    const levels=[0,1,5,8,12,15];
    if(typeof T.eqSpr!=='function') { out.error='eqSpr not exposed on T'; return out; }
    for(const pl of levels){
      const c=T.eqSpr(wKey, 160, pl);
      out.levels[pl]= c? c.toDataURL('image/png') : null;
    }
    return out;
  });

  const fs=require('fs'), path=require('path');
  const dir='/tmp/aura_preview';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  if(result.error){ console.log('ERROR:', result.error, 'wKey:', result.wKey); }
  else {
    for(const pl in result.levels){
      const d=result.levels[pl];
      if(!d) continue;
      fs.writeFileSync(path.join(dir,'pl'+pl+'.png'), Buffer.from(d.split(',')[1],'base64'));
    }
    console.log('wKey:', result.wKey, 'saved:', Object.keys(result.levels));
  }
  await b.close();
})();
