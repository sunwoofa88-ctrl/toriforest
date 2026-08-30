const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.screenshot({path:'L_title.png'});
  await p.evaluate(()=>{const T=window.__TORI,S=T.S;S.lv=12;S.pets={rabbit:1,chick:1};
    S.owned={sword:1};S.tier={sword:1};S.plus={sword:3};T.beginPlay();});
  await p.waitForTimeout(2600);
  await p.evaluate(()=>{document.getElementById('banner').innerHTML='';document.getElementById('toasts').innerHTML='';});
  for(let i=0;i<10;i++){ await p.evaluate(()=>{const T=window.__TORI;let e=null;
    for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}} if(e)T.doAttack(e.x,e.y-e.size*0.5);}); await p.waitForTimeout(85);}
  await p.waitForTimeout(30);
  await p.screenshot({path:'L_slash.png'});
  await b.close(); console.log('ok');
})();
