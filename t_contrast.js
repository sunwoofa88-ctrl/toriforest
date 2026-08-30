/* 캐릭터가 배경에서 튀는가 : 명도·채도 분리 실측 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:960,height:600},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
 await p.waitForTimeout(2400);
 const r=await p.evaluate(()=>{
   const T=window.__TORI;
   function stat(img,W,H){
     const c=document.createElement('canvas'); c.width=W;c.height=H;
     const g=c.getContext('2d'); g.drawImage(img,0,0,W,H);
     const d=g.getImageData(0,0,W,H).data;
     let L=[],S=[];
     for(let i=0;i<W*H;i++){
       if(d[i*4+3]<120) continue;
       const R=d[i*4]/255,G=d[i*4+1]/255,B=d[i*4+2]/255;
       const mx=Math.max(R,G,B),mn=Math.min(R,G,B);
       L.push((mx+mn)/2); S.push(mx===0?0:(mx-mn)/mx);
     }
     const avg=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
     const sd=a=>{const m=avg(a);return Math.sqrt(avg(a.map(v=>(v-m)*(v-m))));};
     return {L:+avg(L).toFixed(3), Lsd:+sd(L).toFixed(3), S:+avg(S).toFixed(3), n:L.length};
   }
   /* 지형 한 조각 */
   const gc=document.createElement('canvas'); gc.width=240;gc.height=240;
   gc.getContext('2d').drawImage(T.WD.ground, 600,600,480,480, 0,0,240,240);
   const gs=stat(gc,240,240);
   /* 몬스터 평균 */
   const ks=Object.keys(T.dbg.SPECIES).slice(0,20);
   let mL=0,mS=0,n=0;
   for(const k of ks){ let mc=null; try{mc=T.dbg.ensureMob(k);}catch(e){}
     if(!mc||!mc.n) continue;
     const s2=stat(mc.n,48,48); mL+=s2.L; mS+=s2.S; n++; }
   return {ground:gs, mobL:+(mL/n).toFixed(3), mobS:+(mS/n).toFixed(3), n};
 });
 console.log('지형   명도 '+r.ground.L+'  명도편차 '+r.ground.Lsd+'  채도 '+r.ground.S);
 console.log('몬스터 명도 '+r.mobL+'  채도 '+r.mobS+'  ('+r.n+'종)');
 const dL=Math.abs(r.mobL-r.ground.L), dS=r.mobS-r.ground.S;
 console.log('');
 console.log('명도 분리 '+dL.toFixed(3)+'  ← 0.18 이상이어야 캐릭터가 튄다');
 console.log('채도 분리 '+dS.toFixed(3)+'  ← 0.15 이상이어야 캐릭터가 튄다');
 console.log('배경 소란함(명도편차) '+r.ground.Lsd+'  ← 0.10 이하여야 차분하다');
 await b.close();
})();
