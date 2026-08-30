/* 장비 전종·펫 조합·타이머 경합 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push(m.text());});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
 await p.waitForTimeout(1200);

 const eq=await p.evaluate(()=>{
   const T=window.__TORI; const bad=[]; let n=0, blank=0;
   for(const id of T.EQ_IDS){
     const E=T.EQUIP[id];
     if(!E){ bad.push(id+': 정의 없음'); continue; }
     if(!E.n||!E.col) bad.push(id+': 이름/색 없음');
     if(!(E.grade>=0&&E.grade<6)) bad.push(id+': 등급 이상 '+E.grade);
     try{
       const spr=T.eqSpr(id);
       if(!spr||!spr.width) { bad.push(id+': 그림 생성 실패'); continue; }
       /* 실제로 뭔가 그려졌는지 (빈 그림이면 안 보인다) */
       const c=document.createElement('canvas'); c.width=spr.width;c.height=spr.height;
       const g=c.getContext('2d'); g.drawImage(spr,0,0);
       const d=g.getImageData(0,0,spr.width,spr.height).data;
       let vis=0; for(let i=3;i<d.length;i+=4) if(d[i]>16) vis++;
       if(vis < spr.width*spr.height*0.01) { blank++; bad.push(id+': 그림이 거의 비었음'); }
     }catch(e){ bad.push(id+': 예외 '+e.message); }
     n++;
   }
   return {n, bad:bad.slice(0,12), badN:bad.length, blank};
 });
 console.log(`장비 ${eq.n}종 그림 생성 · 문제 ${eq.badN}건${eq.badN?'\n  '+eq.bad.join('\n  '):''}`);

 const pet=await p.evaluate(()=>{
   const T=window.__TORI; const bad=[];
   for(const id of T.PET_IDS){ const P=T.PETS[id];
     if(!P) { bad.push(id+': 정의 없음'); continue; }
     if(!(P.grade>=0&&P.grade<T.PET_GRADE.length)) bad.push(id+': 등급 이상 '+P.grade);
   }
   /* 조합 사슬이 끝나는가 : 하급을 잔뜩 넣고 실제로 3마리씩 합쳐 본다.
      doPetFuse 는 '펫 id 3개 배열'을 받는다 (앞서 true 를 넘긴 건 내 시험 코드의 잘못) */
   T.S.pets={}; T.S.petSlot=[];
   for(const id of T.PET_BY_GRADE[0]) T.S.pets[id]=12;
   for(const id of T.PET_BY_GRADE[1]) T.S.pets[id]=6;
   let loops=0, fused=0, stuck=0;
   const total=()=>Object.values(T.S.pets).reduce((a,c)=>a+c,0);
   while(loops++<3000){
     const before=total();
     /* 같은 등급 3마리를 찾아 합친다 */
     let picked=null;
     for(let g=0; g<T.PET_GRADE.length-1 && !picked; g++){
       const pool=[];
       for(const id of T.PET_BY_GRADE[g]){
         const c=T.fuseUsable(id);
         for(let i=0;i<c && pool.length<3;i++) pool.push(id);
         if(pool.length>=3) break;
       }
       if(pool.length===3) picked=pool;
     }
     if(!picked) break;                       /* 더 합칠 게 없다 = 정상 종료 */
     const r=T.doPetFuse(picked);
     if(!r){ bad.push('조합 실패: '+picked.join(',')); break; }
     fused++;
     if(total()>=before){ stuck++; if(stuck>3){ bad.push('조합해도 수가 줄지 않음'); break; } }
     else stuck=0;
   }
   if(loops>=3000) bad.push('조합이 3000회 안에 안 끝남 — 무한 반복 위험');
   return {bad, loops:fused};
 });
 console.log(`펫 ${pet.loops}회 조합 반복 · 문제 ${pet.bad.length}건${pet.bad.length?'\n  '+pet.bad.join('\n  '):''}`);

 /* 타이머 경합 : 이펙트 타이머가 남은 채 장을 넘긴다 */
 const race=await p.evaluate(async()=>{
   const T=window.__TORI; const before=[];
   for(let round=0;round<12;round++){
     for(let i=0;i<6;i++) T.spawnEnemy();
     /* 지연 이펙트가 잔뜩 예약되게 스킬을 연타 */
     for(let i=0;i<8;i++){ let g=null,d=1e9;
       for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
       if(g) T.doAttack(g.x,g.y-g.size*0.5); }
     T.S.ult=100; T.doUlt();
     /* 이펙트가 끝나기 전에 장을 넘긴다 (죽은 세계를 건드리면 여기서 터진다) */
     await new Promise(r=>setTimeout(r,60));
     T.enterChapter(round%110);
     await new Promise(r=>setTimeout(r,140));
   }
   await new Promise(r=>setTimeout(r,1500));
   return {frames:T.dbg.frameCount(), en:T.EN.filter(e=>e.alive&&!e.dead).length};
 });
 console.log(`타이머 경합 12회(이펙트 도중 장 이동) → 프레임 계속 도는 중 (${race.frames})`);
 console.log('\n오류:', errs.length? '❌ '+errs.length+'건\n  '+errs.slice(0,6).join('\n  ') : '✅ 0건');
 await b.close();
})();
