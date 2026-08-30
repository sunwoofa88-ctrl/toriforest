const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 /* 부팅 화면이 뜨자마자 — 로딩이 끝나기 전에 — 캡처해야 의미가 있다 */
 for(const ms of [120, 400, 900]){
   await p.waitForTimeout(ms===120?120:ms-120);
   const d=await p.evaluate(()=>{const c=document.getElementById('bootCv');
     if(!c) return null;
     const g=c.getContext('2d'), a=g.getImageData(0,0,264,264).data;
     let n=0; for(let i=3;i<a.length;i+=4) if(a[i]>24) n++;
     return {filled:n, url:c.toDataURL('image/png')};});
   if(d) require('fs').writeFileSync('/tmp/boot_'+ms+'.png', Buffer.from(d.url.split(',')[1],'base64'));
   console.log(ms+'ms  불투명픽셀 '+(d?d.filled:'none'));
 }
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
