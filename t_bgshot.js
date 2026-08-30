const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const shots=[];
  for(const z of [0,1,2,3]){
    const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
    await p.evaluate(z=>{ const T=window.__TORI; T.S.zone=z; T.S.lv=10+z*6; T.beginPlay(); T.layout(); },z);
    await p.waitForTimeout(1800);
    await p.evaluate(()=>{ document.getElementById('banner').innerHTML=''; document.getElementById('toasts').innerHTML=''; });
    await p.waitForTimeout(200);
    await p.screenshot({path:'z_'+z+'.png'});
    await p.close();
  }
  // 4장 합치기
  await b.close();
  console.log('done');
})();
