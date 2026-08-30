const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:820,height:1180},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();T.S.lv=30;T.S.chap=24;T.enterChapter(24);});
await p.waitForTimeout(900);
await p.evaluate(()=>window.__TORI.openSheet('map',0));
await p.waitForTimeout(900);
await p.screenshot({path:'/root/toriforest/MAPPIN.png'});
console.log('ERR',errs.slice(0,3));
await b.close();})();
