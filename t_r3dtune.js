const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1200,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, keys=Object.keys(T.SPECIES);
   const picks=[keys[3],keys[28],keys[64],keys[97]];
   const AMPS=[1,2,4,7], LINES=[1,0];
   const CELL=132, cv=document.createElement('canvas');
   cv.width=CELL*(AMPS.length*LINES.length+1); cv.height=CELL*picks.length+24;
   const g=cv.getContext('2d'); g.fillStyle='#4E7A3E'; g.fillRect(0,0,cv.width,cv.height);
   g.fillStyle='#FFF'; g.font='bold 13px sans-serif';
   const load=u=>new Promise(res=>{const im=new Image(); im.onload=()=>res(im); im.src=u;});
   let col=0, labels=['2D'];
   for(const L of LINES) for(const A of AMPS) labels.push('선'+(L?'O':'X')+' amp'+A);
   labels.forEach((s,i)=>g.fillText(s, i*CELL+8, 16));
   let stat=null;
   for(let ri=0; ri<picks.length; ri++){
     const u2=T.dbg.bakeOne(picks[ri],288,0);
     g.drawImage(await load(u2), 6, 24+ri*CELL, CELL-12, CELL-12);
     let c=1;
     for(const L of LINES) for(const A of AMPS){
       T.dbg.r3dTune({lines:L, amp:A});
       const u3=T.dbg.bakeOne(picks[ri],288,1);
       g.drawImage(await load(u3), c*CELL+6, 24+ri*CELL, CELL-12, CELL-12);
       stat=T.dbg.r3dStat? T.dbg.r3dStat() : null; c++;
     }
   }
   return {png:cv.toDataURL('image/png'), stat, picks};
 });
 fs.writeFileSync('/root/toriforest/out_tune.png', Buffer.from(r.png.split(',')[1],'base64'));
 console.log('stat:', JSON.stringify(r.stat), r.picks.join(','));
 console.log('오류:', errs.length?errs.slice(0,3):'없음');
 await b.close();
})();
