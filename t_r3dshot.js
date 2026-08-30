/* 2D 조명 vs 3D 음영 : 같은 종을 나란히 굽어 눈으로 비교 */
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1200,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, keys=Object.keys(T.SPECIES);
   const N=10, pick=[]; const step=Math.max(1,Math.floor(keys.length/N));
   for(let i=0;i<N;i++) pick.push(keys[Math.min(keys.length-1,i*step)]);
   const CELL=150, cv=document.createElement('canvas');
   cv.width=CELL*N; cv.height=CELL*2+34; const g=cv.getContext('2d');
   const bg=g.createLinearGradient(0,0,0,cv.height);
   bg.addColorStop(0,'#7FAE63'); bg.addColorStop(1,'#5E8A48');
   g.fillStyle=bg; g.fillRect(0,0,cv.width,cv.height);
   g.fillStyle='#FFF'; g.font='bold 15px sans-serif';
   g.fillText('위 = 기존 2D 조명   /   아래 = 3D 음영(WebGL2)', 10, 22);
   const load=u=>new Promise(res=>{const im=new Image(); im.onload=()=>res(im); im.src=u;});
   let t2=0,t3=0;
   for(let i=0;i<N;i++){
     let a=performance.now(); const u2=T.dbg.bakeOne(pick[i],288,0); t2+=performance.now()-a;
     a=performance.now();     const u3=T.dbg.bakeOne(pick[i],288,1); t3+=performance.now()-a;
     const i2=await load(u2), i3=await load(u3);
     g.drawImage(i2, i*CELL+11, 34+4, CELL-22, CELL-22);
     g.drawImage(i3, i*CELL+11, 34+CELL+4, CELL-22, CELL-22);
   }
   return {png:cv.toDataURL('image/png'), t2:+(t2/N).toFixed(2), t3:+(t3/N).toFixed(2),
           r3d:T.dbg.r3d(), names:pick};
 });
 fs.writeFileSync('/root/toriforest/out_r3d.png', Buffer.from(r.png.split(',')[1],'base64'));
 console.log('종당 굽기 : 2D '+r.t2+'ms · 3D '+r.t3+'ms');
 console.log('R3D:', JSON.stringify(r.r3d));
 console.log('오류:', errs.length? errs.slice(0,3):'없음');
 await b.close();
})();
