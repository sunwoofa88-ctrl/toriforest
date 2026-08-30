/* 지금 렌더러(캔버스2D)가 60fps 로 밀 수 있는 물체 수의 실제 천장 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 const r=await p.evaluate(()=>new Promise(async res=>{
   const T=window.__TORI;
   const spr=T.SPR.fx.puff;
   const cv=document.createElement('canvas');
   cv.width=1024; cv.height=576;
   const g=cv.getContext('2d',{alpha:false});
   async function bench(n, mode){
     // 워밍업
     for(let w=0;w<3;w++) draw(n,mode);
     let t0=performance.now(), f=0;
     while(performance.now()-t0<900){ draw(n,mode); f++; }
     return Math.round(f/((performance.now()-t0)/1000));
   }
   function draw(n,mode){
     g.setTransform(1,0,0,1,0,0);
     g.fillStyle='#3E7A46'; g.fillRect(0,0,1024,576);
     for(let i=0;i<n;i++){
       const x=(i*37)%990, y=(i*61)%540;
       if(mode==='plain'){ g.drawImage(spr,x,y,32,32); }
       else { g.globalAlpha=0.5+((i%10)/20); g.save(); g.translate(x+16,y+16); g.rotate(i*0.1);
              g.drawImage(spr,-16,-16,32,32); g.restore(); }
     }
     g.globalAlpha=1;
   }
   const out={plain:{},rich:{}};
   for(const n of [200,500,1000,2000,4000]) out.plain[n]=await bench(n,'plain');
   for(const n of [200,500,1000,2000]) out.rich[n]=await bench(n,'rich');
   res(out);
 }));
 console.log('단순 drawImage 만:');
 for(const k in r.plain) console.log('  '+String(k).padStart(5)+'개 → '+r.plain[k]+'fps');
 console.log('실제 게임처럼(투명도+회전+save/restore):');
 for(const k in r.rich) console.log('  '+String(k).padStart(5)+'개 → '+r.rich[k]+'fps');
 await b.close();
})();
