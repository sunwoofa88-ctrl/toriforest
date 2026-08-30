/* 오프닝(로딩) 화면 캐릭터가 '지금 주인공' 인가 —
   예전에 여기만 절차적 bake(HERO_SPEC) 을 써서 옛 캐릭터가 떴다(실기 제보). */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 let worst=0, rows=[];
 for(const ms of [120,300,700,1400]){
   await p.waitForTimeout(ms===120?120:300);
   const d=await p.evaluate(()=>{
     const c=document.getElementById('bootCv'); if(!c) return null;
     const g=c.getContext('2d'), px=64;
     const s=document.createElement('canvas'); s.width=s.height=px;
     const sg=s.getContext('2d'); sg.drawImage(c,0,0,px,px);
     const A=sg.getImageData(0,0,px,px).data;
     /* 기준 : HTML 안에 박힌 hero_idle 그림 자체 */
     const src=(typeof ART_DATA!=='undefined')? ART_DATA['hero_idle'] : null;
     if(!src) return {noart:true};
     return new Promise(res=>{
       const im=new Image();
       im.onload=()=>{
         const r=document.createElement('canvas'); r.width=r.height=px;
         const rg=r.getContext('2d');
         const f=0.94, w=px*f, h=px*f;
         rg.drawImage(im,(px-w)/2, px*(112/120)*(1-f), w, h);
         const B=rg.getImageData(0,0,px,px).data;
         let s2=0,n=0,fill=0;
         for(let i=0;i<A.length;i+=4){
           const aa=A[i+3]/255, ba=B[i+3]/255; if(aa>0.5) fill++;
           s2+=Math.abs(aa-ba); n++;
           if(aa>0.5&&ba>0.5) s2+=(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]))/765;
         }
         res({d:s2/n, fill:fill});
       };
       im.onerror=()=>res({err:1});
       im.src=src;
     });
   });
   if(!d||d.noart){ console.log('  hero_idle 그림 없음 — 절차적 폴백이 정상'); break; }
   rows.push([ms, +d.d.toFixed(4), d.fill]);
   worst=Math.max(worst,d.d);
 }
 console.log('부팅 화면 캐릭터 vs hero_idle 원본 (0=동일)');
 rows.forEach(r=>console.log('  '+r[0]+'ms  차이 '+r[1]+'  불투명픽셀 '+r[2]));
 console.log(worst<=0.06 ? '  ✅ 모든 시점에서 현재 주인공(AI 그림) — 옛 캐릭터 프레임 없음'
                         : '  ❌ 옛 캐릭터가 보이는 시점이 있다 (최대 차이 '+worst.toFixed(3)+')');
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
 process.exit(worst<=0.06?0:1);
})();
