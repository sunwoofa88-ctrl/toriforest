/* 3D 음영 베이커 : 동작·품질·비용 확인 */
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1100,height:760},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const st=await p.evaluate(()=>{
   const T=window.__TORI;
   return {ok:T.dbg.r3d? T.dbg.r3d().ok : 'no-hook'};
 }).catch(e=>({err:String(e)}));
 console.log('R3D 상태:', JSON.stringify(st));
 const shot=await p.evaluate(()=>{
   const T=window.__TORI, keys=Object.keys(T.SPECIES);
   const pick=[], step=Math.floor(keys.length/24);
   for(let i=0;i<24;i++) pick.push(keys[Math.min(keys.length-1,i*step)]);
   const CELL=120, COLS=8, ROWS=3;
   const cv=document.createElement('canvas'); cv.width=CELL*COLS; cv.height=CELL*ROWS;
   const g=cv.getContext('2d');
   g.fillStyle='#6E9C55'; g.fillRect(0,0,cv.width,cv.height);
   const t0=performance.now();
   pick.forEach((k,i)=>{
     const mc=T.dbg.MOB_CACHE, sp=T.SPECIES[k];
     const img=(T.dbg.ensureMob? T.dbg.ensureMob(k) : null);
   });
   return {ms:performance.now()-t0};
 }).catch(e=>({err:String(e)}));
 console.log('오류:', errs.length? errs.slice(0,4) : '없음');
 await b.close();
})();
