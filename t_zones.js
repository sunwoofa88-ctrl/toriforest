const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
for(const z of [0,1,2,3]){
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  await p.evaluate(z=>{const T=window.__TORI;T.S.lv=10+z*8;T.beginPlay();T.enterZone(z);},z);
  await p.waitForTimeout(700);
  await p.evaluate(()=>{const T=window.__TORI,c=T.WD.camps[0];T.P.x=c.x-130;T.P.y=c.y-40;});
  await p.waitForTimeout(2600);
  await p.evaluate(()=>{document.getElementById('banner').innerHTML='';document.getElementById('toasts').innerHTML='';
    var m=document.getElementById('moveHint'); if(m)m.classList.add('gone');});
  await p.waitForTimeout(200);
  await p.screenshot({path:'Z2_'+z+'.png'});
  await p.close();
}
console.log('zones ok'); await b.close();})();
