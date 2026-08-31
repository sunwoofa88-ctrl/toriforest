const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:700},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(3500);

  const r=await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    T.EN.length=0; T.P.moving=false; T.P.atkT=0;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    T.S.eq['h_cap_acorn']=1; T.eqSet('h','h_cap_acorn');
    const eqid = (typeof eqAt==='function')? null : null;
    return {
      eqEntry: T.EQUIP['h_cap_acorn'],
      SLOT_TYPES_present: typeof T.SLOT_TYPES,
    };
  });
  console.log(JSON.stringify(r,null,2));
  await p.waitForTimeout(300);
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await p.screenshot({path:'/tmp/cap_debug.png',clip:{x:200,y:150,width:300,height:300}});
  await b.close();
})();
