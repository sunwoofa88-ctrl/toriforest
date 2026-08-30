/* 110장 전수 : 생성·시작점·출구 도달성·보스·클리어조건·몬스터 정의 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
 await p.waitForTimeout(1200);
 const out=await p.evaluate(()=>{
   const T=window.__TORI, D=T.dbg;
   const bad=[]; const info=[];
   /* 타일 BFS : 시작점에서 목표까지 걸어갈 수 있는가 */
   function reach(fromX,fromY,toX,toY){
     const {COLS,ROWS,TS}=D.dims();
     const sx=Math.floor(fromX/TS), sy=Math.floor(fromY/TS);
     const tx=Math.floor(toX/TS),  ty=Math.floor(toY/TS);
     if(sx<0||sy<0||tx<0||ty<0||sx>=COLS||sy>=ROWS||tx>=COLS||ty>=ROWS) return false;
     const seen=new Uint8Array(COLS*ROWS);
     const q=[sy*COLS+sx]; seen[sy*COLS+sx]=1;
     const goal=ty*COLS+tx;
     let head=0;
     while(head<q.length){
       const c=q[head++];
       if(c===goal) return true;
       const cx=c%COLS, cy=(c-cx)/COLS;
       const nb=[[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]];
       for(const [nx,ny] of nb){
         if(nx<0||ny<0||nx>=COLS||ny>=ROWS) continue;
         const i=ny*COLS+nx;
         if(seen[i]) continue;
         seen[i]=1;
         if(!D.walkTile(nx,ny)) continue;
         q.push(i);
       }
     }
     /* 목표 타일이 막힌 칸일 수 있다 → 이웃 중 하나라도 닿으면 통과로 본다 */
     const nb=[[tx+1,ty],[tx-1,ty],[tx,ty+1],[tx,ty-1]];
     for(const [nx,ny] of nb){ if(nx>=0&&ny>=0&&nx<COLS&&ny<ROWS&&seen[ny*COLS+nx]) return true; }
     return false;
   }
   for(let c=0;c<110;c++){
     try{
       T.S.chap=c; T.enterChapter(c);
       const W=T.WD;
       if(!W){ bad.push(c+'장: 월드 생성 실패'); continue; }
       if(!W.ground) bad.push(c+'장: 지형 없음');
       if(!W.spawn) { bad.push(c+'장: 시작점 없음'); continue; }
       if(!W.exitGate) bad.push(c+'장: 출구 문 없음');
       if(!W.camps || !W.camps.length) bad.push(c+'장: 몬스터 캠프 없음');
       const need=D.chapKillNeed(c);
       if(!(need>0) || !isFinite(need)) bad.push(c+'장: 클리어 조건 이상 ('+need+')');
       /* 몬스터 정의가 실제로 있는가 */
       const mobs=D.chapMobs(c);
       if(!mobs || !mobs.length) bad.push(c+'장: 등장 몬스터 없음');
       else for(const k of mobs) if(!D.SPECIES[k]) bad.push(c+'장: 없는 몬스터 '+k);
       /* 캠프 몬스터도 확인 */
       for(const cp of W.camps) if(!D.SPECIES[cp.mob]) bad.push(c+'장: 캠프 몬스터 없음 '+cp.mob);
       /* 시작점이 걸을 수 있는 곳인가 */
       const {TS}=D.dims();
       if(!D.walkTile(Math.floor(W.spawn.x/TS), Math.floor(W.spawn.y/TS))) bad.push(c+'장: 시작점이 막힌 칸');
       /* 출구까지 걸어갈 수 있는가 */
       if(W.exitGate && !reach(W.spawn.x,W.spawn.y,W.exitGate.x,W.exitGate.y)) bad.push(c+'장: 출구까지 길이 없음');
       /* 보스 장이면 성역까지 갈 수 있는가 + 보스 정의 */
       if(D.chapIsAnyBoss(c)){
         if(!W.arena) bad.push(c+'장: 보스 성역 없음');
         else if(!reach(W.spawn.x,W.spawn.y,W.arena.x,W.arena.y)) bad.push(c+'장: 성역까지 길이 없음');
         const bk = D.chapIsBoss(c)? D.chapBoss(c) : D.chapMid(c);
         if(!bk || !D.SPECIES[bk]) bad.push(c+'장: 보스 정의 없음 ('+bk+')');
       }
       /* 캠프가 구석에 몰려 있지 않은가 (요청사항 검증) */
       const {WW,WH}=D.dims();
       const edge=W.camps.filter(cp=> cp.x<WW*0.14||cp.x>WW*0.86||cp.y<WH*0.14||cp.y>WH*0.86).length;
       info.push({c, camps:W.camps.length, edge, need});
     }catch(e){ bad.push(c+'장: 예외 '+e.message); }
   }
   const edgeTot=info.reduce((a,x)=>a+x.edge,0), campTot=info.reduce((a,x)=>a+x.camps,0);
   return {bad, n:info.length, edgeTot, campTot,
     needMin:Math.min(...info.map(x=>x.need)), needMax:Math.max(...info.map(x=>x.need)),
     campMin:Math.min(...info.map(x=>x.camps))};
 });
 console.log(`검사한 장 ${out.n}/110`);
 console.log(`캠프 총 ${out.campTot}개 · 가장자리(맵 14% 안쪽) ${out.edgeTot}개 · 장당 최소 캠프 ${out.campMin}`);
 console.log(`클리어 조건 ${out.needMin}~${out.needMax}마리`);
 console.log(out.bad.length? '❌ 문제 '+out.bad.length+'건:\n  '+out.bad.slice(0,25).join('\n  ') : '✅ 110장 전부 정상 (출구·보스 도달 가능)');
 console.log('예외:', errs.length? errs.slice(0,3):'없음');
 await b.close();
})();
