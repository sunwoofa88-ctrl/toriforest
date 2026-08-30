/* 그림 슬롯이 실제로 적용되는지 : 그림 있는 종 vs 없는 종 */
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const r=await p.evaluate(async()=>{
   const T=window.__TORI;
   const keys=['meadow_0','meadow_9','meadow_1','meadow_2'];
   const CELL=170, cv=document.createElement('canvas');
   cv.width=CELL*keys.length; cv.height=CELL+22;
   const g=cv.getContext('2d'); g.fillStyle='#5C8A46'; g.fillRect(0,0,cv.width,cv.height);
   g.fillStyle='#FFF'; g.font='bold 13px sans-serif';
   keys.forEach((k,i)=>{
     const mc=T.dbg.ensureMob(k);
     if(mc) g.drawImage(mc.n, i*CELL+10, 22, CELL-20, CELL-20);
     g.fillText(k, i*CELL+10, 16);
   });
   return {png:cv.toDataURL('image/png'),
           art:Object.keys(window.ART_SRC||{}).length,
           loaded:Object.keys(window.ART_IMG||{}).length};
 });
 fs.writeFileSync('/root/toriforest/out_slot.png', Buffer.from(r.png.split(',')[1],'base64'));
 console.log('주입된 그림', r.art, '· 로드됨', r.loaded);
 console.log('오류:', errs.length?errs.slice(0,3):'없음');
 await b.close();
})();
