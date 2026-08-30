const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 for(const [nm,w,h,d,tab] of [['s22_gear',915,412,2.6,'gear'],['s22_pet',915,412,2.6,'pet'],['s22_map',915,412,2.6,'map']]){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
  await p.waitForTimeout(1200);
  await p.evaluate(t=>window.__TORI.openSheet(t),tab);
  await p.waitForTimeout(600);
  await p.screenshot({path:`/root/toriforest/shots/${nm}.png`});
  await p.close();
 }
 await b.close(); console.log('ok');
})();
