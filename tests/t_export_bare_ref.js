const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(500);
  const dataUrl=await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    return T.SPR.hero.idle.toDataURL('image/png');
  });
  const fs=require('fs');
  const b64=dataUrl.split(',')[1];
  fs.writeFileSync('/tmp/bare_ref_192.png', Buffer.from(b64,'base64'));
  console.log('saved');
  await b.close();
})();
