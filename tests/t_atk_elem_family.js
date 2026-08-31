const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:2});
  const errs=[];
  p.on('pageerror', e=>errs.push('pageerror: '+e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push('console.error: '+m.text()); });
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(3500);

  const wants = ['fire','ice','leaf','light','shade'];
  const found = await p.evaluate((wants)=>{
    const T=window.__TORI;
    const out={};
    for(const w of wants){
      for(const k in T.EQUIP){
        const e=T.EQUIP[k];
        if(e.slot===0 && /sword/.test(k) && new RegExp(w).test(k)){ out[w]=k; break; }
      }
    }
    return out;
  }, wants);

  const fs=require('fs');
  for(const elem of wants){
    const wKey = found[elem];
    if(!wKey){ console.log('SKIP (no weapon found) for', elem); continue; }
    await p.evaluate((wKey)=>{
      const T=window.__TORI;
      T.S.eq=T.S.eq||{}; T.S.eq[wKey]=1; T.eqSet('w', wKey);
      T.S.eqPlus=T.S.eqPlus||{}; T.S.eqPlus[wKey]=13; // >=12 to trigger elemental flare
      T.P.fx=1; T.P.fy=0; T.P.facing=1;
    }, wKey);
    await p.evaluate(()=>{ const T=window.__TORI; T.doAttack(T.P.x+200, T.P.y); });
    await p.waitForTimeout(90);
    const buf = await p.screenshot();
    fs.writeFileSync('/tmp/atk_elem_'+elem+'.png', buf);
    await p.waitForTimeout(400);
  }

  console.log('weapons used:', JSON.stringify(found));
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit(errs.length? 1 : 0);
})();
