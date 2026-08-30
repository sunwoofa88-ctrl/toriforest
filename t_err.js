const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const e=[];p.on('pageerror',x=>{e.push(x.stack||x.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(600);
for(const c of [0,27,86,105]){
  await p.evaluate(x=>window.__TORI.enterChapter(x),c);
  await p.waitForTimeout(900);
  await p.mouse.move(100,640); await p.mouse.down();
  for(let i=0;i<40;i++){ await p.mouse.move(100+Math.cos(i/6)*46,640+Math.sin(i/6)*46); await p.waitForTimeout(30); }
  await p.mouse.up();
  if(e.length) break;
}
console.log(e.length? e.slice(0,3).join('\n----\n') : '에러 없음');
await b.close();})();
