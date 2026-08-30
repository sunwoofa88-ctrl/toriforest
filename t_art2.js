const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const e=[];p.on('pageerror',x=>{if(e.indexOf(x.message)<0)e.push(x.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.beginPlay();});
await p.waitForTimeout(900);
const shots=[[0,'A_ch1'],[15,'A_lake'],[35,'A_volc'],[95,'A_hallow']];
for(const [c,n] of shots){
  await p.evaluate(x=>window.__TORI.enterChapter(x),c);
  await p.waitForTimeout(1100);
  await p.screenshot({path:n+'.png'});
}
// 마을 클로즈업 : 스폰 지점에 카메라 고정
await p.evaluate(()=>{const T=window.__TORI;T.enterChapter(0);});
await p.waitForTimeout(1000);
await p.screenshot({path:'A_village.png'});
// 캠프
await p.evaluate(()=>{const T=window.__TORI,c=T.WD.camps[0];T.P.x=c.x;T.P.y=c.y+60;});
await p.waitForTimeout(700);
await p.screenshot({path:'A_camp.png'});
// 성역
await p.evaluate(()=>{const T=window.__TORI;T.P.x=T.WD.arena.x;T.P.y=T.WD.arena.y+80;});
await p.waitForTimeout(700);
await p.screenshot({path:'A_arena.png'});
console.log(e.length?'ERR '+e.join('|'):'에러 없음');
await b.close();})();
