const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const DEV=[{n:'폰 393x808',w:393,h:808,d:2.75},{n:'폰가로 808x393',w:808,h:393,d:2.75},
           {n:'태블릿 800x1280',w:800,h:1280,d:2},{n:'태블릿가로 1280x800',w:1280,h:800,d:2},
           {n:'PC 1440x900',w:1440,h:900,d:1}];
for(const D of DEV){
  const p=await b.newPage({viewport:{width:D.w,height:D.h},deviceScaleFactor:D.d,isMobile:D.w<900,hasTouch:D.w<900});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();
    const mh=document.getElementById('moveHint'); if(mh) mh.classList.add('gone');});
  await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{
    const f=document.getElementById('frame').getBoundingClientRect();
    const sc=document.querySelector('.skill-cluster').getBoundingClientRect();
    const atk=document.getElementById('btnAtk').getBoundingClientRect();
    const ult=document.getElementById('btnUlt').getBoundingClientRect();
    const inh=document.getElementById('btnInhale').getBoundingClientRect();
    return {rightGap:Math.round(f.right-sc.right), bottomGap:Math.round(f.bottom-sc.bottom),
      atkC:Math.round(atk.left+atk.width/2), atkSz:Math.round(atk.width),
      ultSz:Math.round(ult.width), inhSz:Math.round(inh.width),
      W:Math.round(f.width), sideR: Math.round((atk.left+atk.width/2)/f.width*100)};
  });
  console.log(D.n.padEnd(18)+' 공격버튼 '+r.atkSz+'px  삼키기 '+r.inhSz+'  필살기 '+r.ultSz+
    '   오른쪽여백 '+r.rightGap+'  아래여백 '+r.bottomGap+'  가로위치 '+r.sideR+'%');
  await p.close();
}
await b.close();})();
