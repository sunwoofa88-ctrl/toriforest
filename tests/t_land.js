const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:808,height:393},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.S.star=3000;T.beginPlay();
  for(let i=0;i<20;i++) T.giveEquip(T.rollEquipDrop(60,true));});
await p.waitForTimeout(700);
for(const [s,t] of [['gear',2],['make',2]]){
  const r=await p.evaluate(async([s,t])=>{
    const T=window.__TORI; T.openSheet(s,t);
    await new Promise(r=>setTimeout(r,320));
    const bd=document.getElementById('sheetBody'), br=bd.getBoundingClientRect();
    const out=[];
    [...bd.children].forEach(e=>{const q=e.getBoundingClientRect();
      out.push({cls:(e.className||e.tagName)+'', h:Math.round(q.height), top:Math.round(q.top-br.top)});});
    const main=bd.querySelector('.bigbtn,.bestbtn');
    return {viewH:Math.round(br.height), kids:out,
      mainTop: main? Math.round(main.getBoundingClientRect().top-br.top):-1};
  },[s,t]);
  console.log(s+t+'  보이는높이 '+r.viewH+'  주요버튼 위치 '+r.mainTop);
  r.kids.forEach(k=>console.log('    '+k.cls.slice(0,28).padEnd(28)+' h='+String(k.h).padStart(4)+' top='+k.top));
}
await b.close();})();
