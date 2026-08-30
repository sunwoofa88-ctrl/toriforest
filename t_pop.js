/* 몬스터가 '자기가 서 있는 바닥'에서 튀는가 — 국소 대비 실측
   맵 전체 명도편차는 길·절벽·물 같은 '의도된 구조'까지 세므로 이 질문의 답이 아니다.
   실제로 중요한 것은 몬스터 픽셀과 그 몬스터 주변 바닥 픽셀의 차이다. */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1100,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=35;T.beginPlay();});
 await p.waitForTimeout(1800);
 const MEAS=()=>p.evaluate(()=>{
   const T=window.__TORI, cv=document.querySelector('canvas');
   const g=cv.getContext('2d'), DPR=T.dpr||1;
   const W=cv.width, H=cv.height;
   const img=g.getImageData(0,0,W,H).data;
   function lum(i){ const R=img[i*4]/255,G=img[i*4+1]/255,B=img[i*4+2]/255;
     return (Math.max(R,G,B)+Math.min(R,G,B))/2; }
   function sat(i){ const R=img[i*4]/255,G=img[i*4+1]/255,B=img[i*4+2]/255;
     const mx=Math.max(R,G,B),mn=Math.min(R,G,B); return mx===0?0:(mx-mn)/mx; }
   const live=T.EN.filter(e=>e.alive&&!e.dead);
   const out=[];
   for(const e of live){
     const sx=Math.round((e.x-T.cam.x)*DPR), sy=Math.round((e.y-T.cam.y)*DPR);
     /* ★ e.y 는 '발밑' 이다. 몸통 중심은 그보다 위(size*0.55)에 있다.
          발밑을 재면 그림자와 발밑 링을 재게 되어 값이 잘못 나온다. */
     const cy2 = sy - Math.round(e.size*0.55*DPR);
     const rr=Math.round(e.size*0.26*DPR), ro=Math.round(e.size*1.05*DPR);
     if(sx-ro<0||cy2-ro<0||sx+ro>=W||cy2+ro>=H) continue;
     let inL=[],inS=[],outL=[],outS=[];
     for(let y=cy2-ro;y<cy2+ro;y+=2) for(let x=sx-ro;x<sx+ro;x+=2){
       const d2=(x-sx)*(x-sx)+(y-cy2)*(y-cy2), i=y*W+x;
       if(d2 < rr*rr){ inL.push(lum(i)); inS.push(sat(i)); }
       else if(d2 > ro*ro*0.72 && d2 < ro*ro){ outL.push(lum(i)); outS.push(sat(i)); }
     }
     if(inL.length<20||outL.length<20) continue;
     const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
     /* 경계 세기 : 실루엣 테두리를 가로지르는 밝기 변화의 최대값.
        사람 눈은 '평균 차이'가 아니라 '경계'로 형태를 읽는다 — 이게 진짜 지표다. */
     /* ★ 고정 반지름(ro*0.52)에서만 재면 안 된다.
          가는 몬스터(뱀·새)는 실루엣 경계가 그보다 훨씬 안쪽이라
          바닥→바닥 구간을 재게 되고 경계가 약한 것처럼 잘못 나온다(실측 0.094).
          중심에서 바깥까지 광선을 끝까지 훑어 '가장 큰 밝기 계단'을 찾는다 —
          외곽선이 있으면 그 계단이 곧 실루엣 경계다. */
     let rays=[];
     for(let a2=0;a2<24;a2++){
       const an=a2/24*6.2832, ca=Math.cos(an), sa=Math.sin(an);
       let prev=null, mx2=0;
       for(let rd=Math.round(ro*0.10); rd<=ro; rd++){
         const x=Math.round(sx+ca*rd), y=Math.round(cy2+sa*rd);
         if(x<0||y<0||x>=W||y>=H) break;
         const v=lum(y*W+x);
         if(prev!==null) mx2=Math.max(mx2, Math.abs(v-prev));
         prev=v;
       }
       rays.push(mx2);
     }
     /* 한 방향만 세면 우연에 좌우된다 → 24방향 중 하위 25% 를 버리고 중앙값을 쓴다.
        '어느 방향에서 봐도 경계가 읽히는가' 를 묻는 지표다. */
     rays.sort((a,b)=>a-b);
     const edge = rays[Math.floor(rays.length*0.5)];
     out.push({dL:Math.abs(avg(inL)-avg(outL)), dS:Math.abs(avg(inS)-avg(outS)), edge:edge});
   }
   if(!out.length) return {n:0};
   const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
   const dL=out.map(o=>o.dL), dS=out.map(o=>o.dS), ed=out.map(o=>o.edge);
   dL.sort((a,b)=>a-b); dS.sort((a,b)=>a-b); ed.sort((a,b)=>a-b);
   return {n:out.length, raw:out, dLavg:+avg(dL).toFixed(3), dLmin:+dL[0].toFixed(3),
           dSavg:+avg(dS).toFixed(3), dSmin:+dS[0].toFixed(3),
           edAvg:+avg(ed).toFixed(3), edMin:+ed[0].toFixed(3)};
 });
 /* ★ 표본 5마리로는 판정이 실행마다 뒤집힌다(실측: 경계 0.239~0.646).
      여러 스테이지를 돌며 모든 화면 안 몬스터를 모아 한 번에 판정한다. */
 let all=[];
 for(const lv of [5,18,35,52,70,88]){
   await p.evaluate(v=>{const T=window.__TORI;T.S.lv=v;T.beginPlay();},lv);
   await p.waitForTimeout(1400);
   await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<14;i++)T.spawnEnemy();});
   await p.waitForTimeout(1100);
   const one=await MEAS();
   if(one.raw) all=all.concat(one.raw);
 }
 const avgA=a=>a.reduce((x,y)=>x+y,0)/a.length;
 const pick=(k)=>{const v=all.map(o=>o[k]).sort((a,b)=>a-b);
   return {avg:+avgA(v).toFixed(3), min:+v[0].toFixed(3), p10:+v[Math.floor(v.length*0.10)].toFixed(3)};};
 const r = all.length? {n:all.length, L:pick('dL'), S:pick('dS'), E:pick('edge')} : {n:0};
 if(!r.n){ console.log('표본 없음'); }
 else{
   console.log('표본 '+r.n+'마리 (6개 스테이지 · 화면 안 전수)');
   console.log('  몸통 vs 주변바닥  명도차 평균 '+r.L.avg+' · 하위10% '+r.L.p10+' · 최악 '+r.L.min);
   console.log('  몸통 vs 주변바닥  채도차 평균 '+r.S.avg+' · 하위10% '+r.S.p10+' · 최악 '+r.S.min);
   console.log('  실루엣 경계 세기    평균 '+r.E.avg+' · 하위10% '+r.E.p10+' · 최악 '+r.E.min+'   ← 하위10%가 0.15 이상이어야 한다');
   const ok = r.E.p10>=0.15;
   console.log(ok? '  ✅ 모든 몬스터가 바닥에서 형태로 구분된다' : '  ❌ 경계가 약한 몬스터가 있다');
 }
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
