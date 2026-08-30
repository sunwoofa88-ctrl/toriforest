const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:900,height:520},deviceScaleFactor:2});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.beginPlay();});
await p.waitForTimeout(700);
// 강화 단계별 아이콘 비교
await p.evaluate(()=>{
  const T=window.__TORI;
  const wid=T.EQ_WEP.find(x=>T.EQUIP[x].grade>=4)||T.EQ_WEP[0];
  const aid=T.EQ_ARM.find(x=>T.EQUIP[x].grade>=4)||T.EQ_ARM[0];
  const cv=document.createElement('canvas'); cv.width=900; cv.height=520;
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#1E1810';
  document.body.appendChild(cv); const g=cv.getContext('2d');
  g.font='bold 15px sans-serif'; g.textAlign='center';
  const lv=[0,3,6,9,12,15];
  lv.forEach((pl,i)=>{
    g.drawImage(T.eqSpr(wid,150,pl), i*148+8, 10, 140,140);
    g.drawImage(T.eqSpr(aid,150,pl), i*148+8, 190, 140,140);
    g.fillStyle='#FFE9A6'; g.fillText('+'+pl, i*148+78, 168);
  });
  g.fillStyle='#FFE9A6'; g.textAlign='left';
  g.fillText('무기 강화 단계', 12, 350);
  g.fillText('방어구 강화 단계', 12, 372);
  // 주인공 아우라
  const heroX=[0,5,9,12,15];
  heroX.forEach((pl,i)=>{
    T.S.eq[wid]=1; T.S.eqW=wid; T.S.eqPlus[wid]=pl; T.refreshHeroArt();
  });
});
await p.waitForTimeout(400);
await p.screenshot({path:'/root/toriforest/AURA.png'});
await b.close();})();
