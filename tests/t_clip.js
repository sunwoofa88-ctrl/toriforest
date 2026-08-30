const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
for(const [n,w,h,d] of [['320',320,640,2],['393',393,808,2.75],['412',412,846,3],['가로808',808,393,2.75],['태블릿800',800,1280,2],['태블릿1280',1280,800,2],['PC1440',1440,900,1]]){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:w<900,hasTouch:w<900});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=99;T.S.acorn=99999999;T.S.star=99999;
    T.S.abil='pumpkin_heavy'; T.S.owned['pumpkin_heavy']=1; T.S.tier['pumpkin_heavy']=2; T.S.plus['pumpkin_heavy']=10;
    T.beginPlay(); T.enterChapter(109);});
  await p.waitForTimeout(800);
  const r=await p.evaluate(()=>{
    const f=document.getElementById('frame').getBoundingClientRect();
    const hd=document.querySelector('.hud').getBoundingClientRect();
    let clip=[];
    ['uiZone','uiStage','uiAbil','uiCoin','uiStar','uiHpTxt'].forEach(id=>{
      const e=document.getElementById(id); if(!e) return;
      if(e.scrollWidth>e.clientWidth+2) clip.push(id);
    });
    let over=0;
    document.querySelectorAll('.hud *').forEach(e=>{const q=e.getBoundingClientRect();
      if(q.width>0&&(q.right>f.right+2||q.left<f.left-2)) over++;});
    return {h:Math.round(hd.height), pct:Math.round(hd.height/f.height*100), clip, over};
  });
  console.log(n.padEnd(11)+' HUD '+String(r.h).padStart(4)+'px('+String(r.pct).padStart(2)+'%)  글자잘림 '+(r.clip.length?r.clip.join(','):'없음')+'  화면밖 '+r.over);
  await p.close();
}
await b.close();})();
