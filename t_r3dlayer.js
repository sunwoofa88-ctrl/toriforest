const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1200,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const key=process.argv[2]||null;
 const r=await p.evaluate(async(K)=>{
   const T=window.__TORI, keys=Object.keys(T.SPECIES);
   const k=K||keys[Math.floor(keys.length*0.42)];
   const L=T.dbg.r3dLayers(k,288); if(!L) return {err:'no gl'};
   const names=['그라데이션 원본','평탄 알베도','mul(곱하기)','add(스크린)','3D 최종','2D 최종'];
   const srcs=[L.grad,L.flat,L.mul,L.add,L.fin,L.old];
   const CELL=250, cv=document.createElement('canvas');
   cv.width=CELL*3; cv.height=CELL*2+26; const g=cv.getContext('2d');
   g.fillStyle='#4E7A3E'; g.fillRect(0,0,cv.width,cv.height);
   g.fillStyle='#FFF'; g.font='bold 15px sans-serif'; g.fillText(k,8,18);
   const load=u=>new Promise(res=>{const im=new Image(); im.onload=()=>res(im); im.src=u;});
   for(let i=0;i<6;i++){
     const im=await load(srcs[i]);
     const x=(i%3)*CELL, y=26+Math.floor(i/3)*CELL;
     g.drawImage(im,x+8,y+18,CELL-16,CELL-26);
     g.fillStyle='#FFE'; g.font='12px sans-serif'; g.fillText(names[i],x+10,y+14);
   }
   return {png:cv.toDataURL('image/png'), k};
 }, key);
 if(r.err){ console.log(r.err); } else {
   fs.writeFileSync('/root/toriforest/out_layer.png', Buffer.from(r.png.split(',')[1],'base64'));
   console.log('종:', r.k); }
 console.log('오류:', errs.length?errs.slice(0,3):'없음');
 await b.close();
})();
