const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--disable-gpu-vsync','--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(1200);
console.log('IDLE  ', JSON.stringify(await p.evaluate(()=>__TORI.dbg.aqStat())));
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.S.chap=44;T.enterChapter(44);for(let i=0;i<16;i++)T.spawnEnemy();});
await p.waitForTimeout(800);
console.log('FIGHT ', JSON.stringify(await p.evaluate(()=>__TORI.dbg.aqStat())));
await p.evaluate(()=>{const T=window.__TORI;T.S.ult=100;T.doUlt();});
await p.waitForTimeout(400);
for(let i=0;i<4;i++){ console.log('ULT   ', JSON.stringify(await p.evaluate(()=>__TORI.dbg.aqStat()))); await p.waitForTimeout(250); }
await b.close();})();
