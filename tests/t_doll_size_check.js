const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:500,height:700},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(500);

  await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    if(typeof T.openSheet==='function') T.openSheet('gear',0);
  });
  await p.waitForTimeout(400);
  await p.screenshot({path:'/tmp/doll_bare.png'});

  await p.evaluate(()=>{
    const T=window.__TORI;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===1){ T.S.eq[k]=1; T.eqSet('a',k); break; } }
    T.openSheet('gear',0);
  });
  await p.waitForTimeout(400);
  await p.screenshot({path:'/tmp/doll_geared.png'});

  await b.close();
})();
