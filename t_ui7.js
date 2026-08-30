const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.S.acorn=999999;T.S.star=4000;T.beginPlay();
  for(let i=0;i<50;i++) T.giveEquip(T.rollEquipDrop(70,true));
  T.S.gachaBonus=80; for(let i=0;i<60;i++) T.doGacha();
  T.refreshHeroArt();});
await p.waitForTimeout(900);
const shots=[['gear',0,'U_gear0'],['gear',2,'U_gear2'],['pet',0,'U_pet0'],['pet',1,'U_pet1'],['pet',2,'U_pet2']];
for(const [s,t,n] of shots){
  await p.evaluate(([s,t])=>window.__TORI.openSheet(s,t),[s,t]);
  await p.waitForTimeout(420);
  await p.screenshot({path:n+'.png'});
}
await p.evaluate(()=>window.__TORI.closeSheet());
await p.waitForTimeout(400);
// 인게임 : 장비 착용 상태 + 상자
await p.evaluate(()=>{const T=window.__TORI;
  const c=T.WD.chests[0]; T.P.x=c.x-40; T.P.y=c.y+140;});
await p.waitForTimeout(700);
await p.screenshot({path:'U_chest.png'});
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
