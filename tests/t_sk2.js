const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:800,height:1280},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))errs.push(m.text())});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();T.S.acorn=9999999;T.S.lv=40;
  for(let i=0;i<40;i++) T.giveEquip(T.rollEquipDrop(40,true));});
await p.waitForTimeout(800);
for(const t of [0,1,2]){
  await p.evaluate(t=>window.__TORI.openSheet('bag',t),t);
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const bd=document.getElementById('sheetBody');
    return {hOver:bd.scrollWidth>bd.clientWidth+2, txt:(bd.textContent||'').slice(0,50).replace(/\s+/g,' ')};});
  console.log('bag탭'+t, JSON.stringify(r));
}
await p.evaluate(()=>window.__TORI.openSheet('bag',0));
await p.waitForTimeout(400);
await p.screenshot({path:'/root/toriforest/SKUP.png'});
// 스킬 레벨업 동작
const up=await p.evaluate(()=>{const D=window.__TORI.dbg;const ids=D.curSkills();
  const before=D.skLv(ids[0]); const r=D.skUp(ids[0]); const after=D.skLv(ids[0]);
  return {before, r, after};});
console.log('레벨업:', JSON.stringify(up));
console.log('ERR',errs.slice(0,3));
await b.close();})();
