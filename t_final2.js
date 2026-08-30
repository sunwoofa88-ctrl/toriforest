const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.S.star=5000;T.beginPlay();
  for(let i=0;i<24;i++) T.giveEquip(T.rollEquipDrop(60,true));
  T.S.gachaBonus=20; for(let i=0;i<16;i++) T.doGacha();
  T.refreshHeroArt();});
await p.waitForTimeout(900);
// 보스 문 근처
await p.evaluate(()=>{const T=window.__TORI;T.P.x=T.WD.arenaGate.x; T.P.y=T.WD.arenaGate.y+150;});
await p.waitForTimeout(600); await p.screenshot({path:'F_bgate.png'});
// 출구 문 근처
await p.evaluate(()=>{const T=window.__TORI;T.P.x=T.WD.exitGate.x; T.P.y=T.WD.exitGate.y+150;});
await p.waitForTimeout(600); await p.screenshot({path:'F_egate.png'});
// 강화 화면
await p.evaluate(()=>{const T=window.__TORI;
  const w=T.EQ_WEP.find(id=>T.S.eq[id]); T.S.eqW=w; T.S.eqPlus[w]=9;
  T.openSheet('gear',2);});
await p.waitForTimeout(600); await p.screenshot({path:'F_enh.png'});
await p.evaluate(()=>window.__TORI.closeSheet());
await p.waitForTimeout(300);
// 재료 합치기
await p.evaluate(()=>{const T=window.__TORI;T.TIER_POOL[1].forEach(m=>T.S.mat[m]=8);T.openSheet('make',0);});
await p.waitForTimeout(500); await p.screenshot({path:'F_fuse.png'});
await p.evaluate(()=>window.__TORI.closeSheet());
await p.waitForTimeout(400);
// 새 지도 (섬 지형)
await p.evaluate(()=>{const T=window.__TORI;
  for(let c=0;c<110;c++) if(T.chapTerrain(c)===4){ T.enterChapter(c); break; }});
await p.waitForTimeout(900); await p.screenshot({path:'F_isle.png'});
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
