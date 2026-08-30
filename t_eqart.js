const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1000,height:640},deviceScaleFactor:2});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{
  const T=window.__TORI;
  const cv=document.createElement('canvas'); cv.width=1000; cv.height=640;
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#241A14';
  document.body.appendChild(cv); const g=cv.getContext('2d');
  g.font='bold 13px sans-serif'; g.textAlign='center';
  // 무기 12종 (각 타입 대표 1개, 등급 높은 걸로)
  T.WEP_TYPE.forEach((W,i)=>{
    const cands=T.EQ_WEP.filter(id=>T.EQUIP[id].tn===i);
    cands.sort((a,c)=>T.EQUIP[c].grade-T.EQUIP[a].grade);
    const id=cands[0];
    const col=i%6, row=(i/6)|0;
    g.drawImage(T.eqSpr(id,120), col*162+22, row*156+8, 118,118);
    g.fillStyle='#FFE9A6'; g.fillText(W.n+' ('+T.EQ_GRADE[T.EQUIP[id].grade].n+')', col*162+81, row*156+140);
  });
  // 방어구 10종
  T.ARM_TYPE.forEach((A,i)=>{
    const cands=T.EQ_ARM.filter(id=>T.EQUIP[id].tn===i);
    cands.sort((a,c)=>T.EQUIP[c].grade-T.EQUIP[a].grade);
    const id=cands[0];
    const col=i%5, row=(i/5)|0;
    g.drawImage(T.eqSpr(id,120), col*196+42, 330+row*152, 116,116);
    g.fillStyle='#B7E8FF'; g.fillText(A.n+' ('+T.EQ_GRADE[T.EQUIP[id].grade].n+')', col*196+100, 330+row*152+132);
  });
});
await p.waitForTimeout(400);
await p.screenshot({path:'EQART.png'});
// 갑옷 입은 토리 6종
await p.evaluate(()=>{
  const T=window.__TORI;
  document.querySelector('canvas[style*="99999"]').remove();
  const cv=document.createElement('canvas'); cv.width=1000; cv.height=380;
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#7FB86A';
  document.body.appendChild(cv); const g=cv.getContext('2d');
  const picks=['vest','plate','robe','cloak','wing','royal','spike','hood','scale','myth'];
  g.font='bold 15px sans-serif'; g.textAlign='center';
  picks.forEach((t,i)=>{
    const tn=T.ARM_TYPE.findIndex(a=>a.id===t);
    const cands=T.EQ_ARM.filter(id=>T.EQUIP[id].tn===tn);
    cands.sort((a,c)=>T.EQUIP[c].grade-T.EQUIP[a].grade);
    const id=cands[0];
    T.S.eq[id]=1; T.S.eqA=id; T.refreshHeroArt();
    const col=i%5, row=(i/5)|0;
    g.drawImage(T.SPR.hero.idle, col*196+48, 10+row*180, 150,150);
    g.fillStyle='#12240E'; g.fillText(T.ARM_TYPE[tn].n, col*196+123, 175+row*180);
  });
});
await p.waitForTimeout(500);
await p.screenshot({path:'EQHERO.png'});
await b.close();})();
