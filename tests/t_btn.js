const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:915,height:412},deviceScaleFactor:2.6,isMobile:true,hasTouch:true});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
 await p.waitForTimeout(2000);
 await p.screenshot({path:'/root/toriforest/shots/btn.png'});
 await b.close();
})();
