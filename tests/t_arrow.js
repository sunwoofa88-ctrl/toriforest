/* 화살표가 '보이는 몬스터'에는 안 뜨고, 멀리 있을 때만 뜨는지 실제 렌더로 확인 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>window.__TORI.beginPlay());
 await p.waitForTimeout(1600);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI,D=T.dbg; D.setRoam(0);
   const out={};
   // ① 바로 옆에 몬스터
   for(const e of T.EN) e.alive=false;
   for(let i=0;i<3;i++){ const e=T.spawnEnemy(); if(e){e.x=T.P.x+90+i*40;e.y=T.P.y+10;} }
   await new Promise(r=>setTimeout(r,300));
   let t=D.objTarget();
   out.가까움={d:Math.round(Math.hypot(t.x-T.P.x,t.y-T.P.y)),near:!!t.near,화살표:'생략되어야'};
   // 실제로 drawObjective 가 그렸는지 : 캔버스 명령 감시
   out.가까움.그림 = await (async()=>{
     const C=CanvasRenderingContext2D.prototype, o=C.drawImage; let n=0;
     const oft=C.fillText; let ft=0;
     C.fillText=function(s){ if(String(s).indexOf('몬스터')>=0) ft++; return oft.apply(this,arguments); };
     await new Promise(r=>setTimeout(r,400));
     C.fillText=oft; return ft;
   })();
   // ② 몬스터를 전부 멀리 치움
   for(const e of T.EN){ if(e.alive){ e.x=T.P.x+2200; e.y=T.P.y+1200; } }
   await new Promise(r=>setTimeout(r,300));
   t=D.objTarget();
   out.멈={d:Math.round(Math.hypot(t.x-T.P.x,t.y-T.P.y)),near:!!t.near};
   out.멈.그림 = await (async()=>{
     const C=CanvasRenderingContext2D.prototype, oft=C.fillText; let ft=0;
     C.fillText=function(s){ if(String(s).indexOf('몬스터')>=0) ft++; return oft.apply(this,arguments); };
     await new Promise(r=>setTimeout(r,400));
     C.fillText=oft; return ft;
   })();
   return out;
 });
 console.log('가까운 몬스터(옆):', JSON.stringify(r.가까움), r.가까움.그림===0?'✅ 화살표 안 뜸':'❌ 화살표 뜸');
 console.log('먼 몬스터:      ', JSON.stringify(r.멈),   r.멈.그림>0?'✅ 화살표 뜸':'❌ 화살표 안 뜸');
 await b.close();
})();
