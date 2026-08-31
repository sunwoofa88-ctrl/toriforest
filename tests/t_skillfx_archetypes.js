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

  const types = ['staff','hammer','bow'];
  const found = await p.evaluate((types)=>{
    const T=window.__TORI;
    const out={};
    for(const ty of types){
      for(const k in T.EQUIP){
        const e=T.EQUIP[k];
        if(e.slot===0 && new RegExp('^w_'+ty+'_').test(k)){ out[ty]=k; break; }
      }
    }
    return out;
  }, types);

  const fs=require('fs');
  for(const ty of types){
    const wKey = found[ty];
    if(!wKey){ console.log('SKIP no weapon for', ty); continue; }
    await p.evaluate((wKey)=>{
      const T=window.__TORI;
      T.S.eq=T.S.eq||{}; T.S.eq[wKey]=1; T.eqSet('w', wKey);
      T.S.eqPlus=T.S.eqPlus||{}; T.S.eqPlus[wKey]=13;
      T.P.fx=1; T.P.fy=0; T.P.facing=1;
    }, wKey);
    // basic attack
    await p.evaluate(()=>{ const T=window.__TORI; T.doAttack(T.P.x+200, T.P.y); });
    await p.waitForTimeout(90);
    fs.writeFileSync('/tmp/skillfx_'+ty+'_basic.png', await p.screenshot());
    await p.waitForTimeout(400);
    // slot-0 skill
    await p.evaluate(()=>{
      const T=window.__TORI;
      const skills=T.curSkills? T.curSkills():null;
      const sid = skills? skills[0] : null;
      if(sid) T.doAttack(T.P.x+200, T.P.y, sid);
    });
    await p.waitForTimeout(150);
    fs.writeFileSync('/tmp/skillfx_'+ty+'_skill0.png', await p.screenshot());
    await p.waitForTimeout(500);
  }

  console.log('weapons used:', JSON.stringify(found));
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit(errs.length? 1 : 0);
})();
