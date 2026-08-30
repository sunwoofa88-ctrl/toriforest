const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
for(const bi of [2,3,6,7,8,9]){
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
  await p.evaluate(bi=>{const T=window.__TORI;T.S.lv=20+bi*8;T.beginPlay();T.enterChapter(bi*10+3);},bi);
  await p.waitForTimeout(900);
  await p.evaluate(()=>{const T=window.__TORI,c=T.WD.camps[0];T.P.x=c.x-140;T.P.y=c.y-30;});
  await p.waitForTimeout(2800);
  await p.evaluate(()=>{document.getElementById('banner').innerHTML='';document.getElementById('toasts').innerHTML='';
    var m=document.getElementById('moveHint'); if(m)m.classList.add('gone');});
  await p.waitForTimeout(200);
  await p.screenshot({path:'B_'+bi+'.png'});
  await p.close();
}
console.log('ok'); await b.close();})();
