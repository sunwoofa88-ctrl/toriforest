const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{const T=window.__TORI,S=T.S;S.lv=8;S.pets={rabbit:1,chick:1};T.beginPlay();});
  await p.waitForTimeout(3000);
  await p.evaluate(()=>{document.getElementById('banner').innerHTML='';document.getElementById('toasts').innerHTML='';});
  const kinds=[['sword',0],['fire',0],['ice',0],['leafb',0],['hammer',0],['bomb',0]];
  for(const [a,t] of kinds){
    await p.evaluate(a=>{const T=window.__TORI;T.S.abil=a;T.S.owned[a]=1;},a);
    await p.waitForTimeout(420);
    await p.evaluate(()=>{const T=window.__TORI;let e=null;
      for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}}
      T.doAttack(e?e.x:T.P.x+180, e?e.y-e.size*0.5:T.P.y-70);});
    await p.waitForTimeout(a==='bomb'?520:(a==='leafb'?260:70));
    await p.screenshot({path:'S_'+a+'.png'});
  }
  await b.close(); console.log('ok');
})();
