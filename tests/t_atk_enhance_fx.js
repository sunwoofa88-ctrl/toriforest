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

  const setup = await p.evaluate(()=>{
    const T=window.__TORI;
    let wKey=null;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0 && /sword/.test(k) && /fire/.test(k)){ wKey=k; break; } }
    T.S.eq=T.S.eq||{};
    T.S.eq[wKey]=1;
    T.eqSet('w', wKey);
    // spawn a dummy enemy in front so attacks have a target direction consistently
    T.P.fx=1; T.P.fy=0; T.P.facing=1;
    return {wKey};
  });

  async function attackAt(plus){
    await p.evaluate((plus)=>{
      const T=window.__TORI;
      const wKey=T.S.eqW;
      T.S.eqPlus=T.S.eqPlus||{};
      T.S.eqPlus[wKey]=plus;
    }, plus);
    await p.evaluate(()=>{
      const T=window.__TORI;
      T.doAttack(T.P.x+200, T.P.y);
    });
    await p.waitForTimeout(90); // capture mid-animation
    return await p.screenshot();
  }

  const fs=require('fs');
  const levels=[0,8,15];
  for(const pl of levels){
    const buf = await attackAt(pl);
    fs.writeFileSync('/tmp/atk_pl'+pl+'.png', buf);
    await p.waitForTimeout(400); // let fx clear before next
  }

  console.log('setup:', JSON.stringify(setup));
  console.log('ERRORS:', errs.length? JSON.stringify(errs,null,2) : 'none');
  await b.close();
  process.exit(errs.length? 1 : 0);
})();
