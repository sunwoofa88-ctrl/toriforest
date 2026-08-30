const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  const want=['sword','hammer','spear','bow','staff','axe'];
  for(const wt of want){
    const ok=await p.evaluate(w=>{
      const T=window.__TORI;
      for(const k in T.EQUIP){ const e=T.EQUIP[k];
        if(e.slot===0 && T.WEP_TYPE[e.tn] && T.WEP_TYPE[e.tn].id===w){
          T.S.eq=T.S.eq||{}; T.S.eq[k]=1; T.S.eqOn=T.S.eqOn||{}; T.S.eqOn.w=k; T.syncSkillBar(true); return k; } }
      return null;
    }, wt);
    if(!ok){ console.log(wt.padEnd(7)+' : 없음'); continue; }
    await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{
      const T=window.__TORI;
      const names=[...document.querySelectorAll('.skill-row .skn')].map(e=>e.textContent);
      const ids=T.curSkills();
      const kinds=ids.map(i=>T.ABIL[i]?T.ABIL[i].kind:'?');
      const fam=T.wepFam?T.wepFam():'?';
      const tiles=kinds.map(k=> (T.artOf('skic_'+k+'_'+fam)?k+'_'+fam : (T.artOf('skic_'+k)?k:'절차적')));
      return {names,kinds,fam,tiles};
    });
    console.log(wt.padEnd(7)+' fam='+r.fam);
    for(let i=0;i<6;i++) console.log('   '+String(r.names[i]).padEnd(10)+' ['+r.kinds[i].padEnd(7)+'] → '+r.tiles[i]);
    const el=await p.$('.skill-row');
    await el.screenshot({path:'/tmp/w_'+wt+'.png'});
  }
  await b.close();
})();
