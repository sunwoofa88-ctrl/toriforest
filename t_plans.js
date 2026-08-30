/* 골격 15종이 실제로 다르게 나오는지 눈으로 확인 */
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1300,height:900},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, keys=Object.keys(T.SPECIES);
   /* 설계도별로 한 종씩 + 좀비는 세 종 */
   const byPlan={}, zomb=[];
   keys.forEach(k=>{ const a=T.SPECIES[k].art;
     if(a.plan==='zombie'){ if(zomb.length<3) zomb.push(k); }
     if(!byPlan[a.plan]) byPlan[a.plan]=k; });
   const list=Object.keys(byPlan).map(pl=>[pl,byPlan[pl]]).concat(zomb.slice(1).map(k=>['zombie+',k]));
   const CELL=152, COLS=6, ROWS=Math.ceil(list.length/COLS);
   const cv=document.createElement('canvas'); cv.width=CELL*COLS; cv.height=CELL*ROWS+8;
   const g=cv.getContext('2d'); g.fillStyle='#5C8A46'; g.fillRect(0,0,cv.width,cv.height);
   const load=u=>new Promise(res=>{const im=new Image(); im.onload=()=>res(im); im.src=u;});
   for(let i=0;i<list.length;i++){
     const [pl,k]=list[i], x=(i%COLS)*CELL, y=Math.floor(i/COLS)*CELL;
     g.drawImage(await load(T.dbg.bakeOne(k,288,1)), x+8, y+16, CELL-16, CELL-24);
     g.fillStyle='#FFF'; g.font='bold 13px sans-serif'; g.fillText(pl, x+9, y+14);
   }
   return {png:cv.toDataURL('image/png'), n:list.length,
           counts:keys.reduce((a,k)=>{const pl=T.SPECIES[k].art.plan||'?'; a[pl]=(a[pl]||0)+1; return a;},{})};
 });
 fs.writeFileSync('/root/toriforest/out_plans.png', Buffer.from(r.png.split(',')[1],'base64'));
 console.log('설계도별 종 수:', JSON.stringify(r.counts));
 console.log('오류:', errs.length?errs.slice(0,3):'없음');
 await b.close();
})();
