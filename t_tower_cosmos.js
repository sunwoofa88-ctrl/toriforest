/* 별빛의 탑 우주 컨셉 재설계 검증 (2026-09-01)
   사용자 요구: "별빛의 던전에는 우주 외계인, 우주 괴물 등이 나오게 해주고
   일반 던전과 맵 구조가 차원이 달라야한다" + "맵 크기도 절반으로 줄여라"
   확인 항목:
   ① 탑(TW.on)에서는 항상 cosmos 비옴(BIOME 마지막) 강제 — 몬스터·보스도 전부 cosmos_*
   ② 바탕이 허공(T_WATER) 우세 — 본편 자연 지형과 육안으로도 확연히 다름
   ③ 스폰→캠프·아레나·탈출구·아레나문·보물상자 전부 실제로 걸어서 도달 가능
      (타일 플러드필로 직접 검증 — validateWorld() 를 믿지 않고 결과를 재확인)
   ④ 층마다 지형이 실제로 달라짐(시드가 고정되지 않음)
   ⑤ 공유 함수(chapBiome/buildWorld/chapLayout) 수정이 본편 챕터에는 전혀
      영향을 주지 않음(회귀 확인) */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }

(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1300,height:900},deviceScaleFactor:1.5});
p.__errs=[];
p.on('pageerror',e=>p.__errs.push('pageerror: '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))p.__errs.push('console: '+m.text())});
await p.goto(F);
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>{ const T=window.__TORI; T.S.lv=60; T.beginPlay(); });

console.log('\n[1] 탑 층별 cosmos 강제 + 연결성 (스폰→캠프/아레나/문/상자 전부 도달 가능)');
const towerFloors=[1,2,3,4,5,10,11,15,20,30,45,50,70,90,99,100];
const towerResults=await p.evaluate((floors)=>{
  const T=window.__TORI;
  T.S.prog=T.S.prog||{}; T.S.prog['9']={boss:1,kills:999,qm:999};   // 탑 잠금 해제
  const out=[];
  for(const f of floors){
    T.twEnter(f);
    // 게임 스크립트 전체가 IIFE 라 COLS/ROWS/TS/WD 는 window 가 아니라 __TORI 게터로 노출된다
    const COLS=T.COLS, ROWS=T.ROWS, TS=T.TS, WD=T.WD;
    const tiles=Array.from(WD.tiles);
    const cnt={g:0,p:0,t:0,w:0,s:0,r:0,f:0};
    for(const v of tiles){ if(v===0)cnt.g++; else if(v===1)cnt.p++; else if(v===2)cnt.t++;
      else if(v===3)cnt.w++; else if(v===4)cnt.s++; else if(v===5)cnt.r++; else if(v===6)cnt.f++; }
    function idx(tx,ty){ return ty*COLS+tx; }
    function walkable(tx,ty){ if(tx<0||ty<0||tx>=COLS||ty>=ROWS) return false;
      const v=tiles[idx(tx,ty)]; return v!==5 && v!==3; }   // T_ROCK/T_WATER 만 막힘(isSolidTile)
    const stx=Math.floor(WD.spawn.x/TS), sty=Math.floor(WD.spawn.y/TS);
    const seen=new Uint8Array(COLS*ROWS);
    const stack=[[stx,sty]]; seen[idx(stx,sty)]=1;
    let reached=1;
    while(stack.length){
      const [cx,cy]=stack.pop();
      for(const [nx,ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]){
        if(nx<0||ny<0||nx>=COLS||ny>=ROWS) continue;
        if(seen[idx(nx,ny)]) continue;
        if(!walkable(nx,ny)) continue;
        seen[idx(nx,ny)]=1; reached++; stack.push([nx,ny]);
      }
    }
    function reachedAt(px,py){ const tx=Math.floor(px/TS), ty=Math.floor(py/TS);
      return !!seen[idx(Math.max(0,Math.min(COLS-1,tx)), Math.max(0,Math.min(ROWS-1,ty)))]; }
    const campsOk=WD.camps.every(c=>reachedAt(c.x,c.y));
    // chapBiome() 자체는 __TORI 에 노출되지 않으므로, chapMobs()/chapBoss() 가 실제로
    // 반환하는 종 키의 접두사(biomeId_i)로 간접 검증한다 — 종 선택 로직까지 함께 확인된다.
    const mobKeys=T.chapMobs(T.S.chap), bossKey=T.chapBoss(T.S.chap);
    out.push({
      f, biomeId:mobKeys[0].split('_')[0], mobKeys, bossKey,
      cnt, totalTiles:tiles.length,
      spawnOk:reachedAt(WD.spawn.x,WD.spawn.y), arenaOk:reachedAt(WD.arena.x,WD.arena.y),
      exitGateOk:reachedAt(WD.exitGate.x,WD.exitGate.y), arenaGateOk:reachedAt(WD.arenaGate.x,WD.arenaGate.y),
      campsOk, campsN:WD.camps.length,
      chestsOk:WD.chests.every(ch=>reachedAt(ch.x,ch.y)), chestsN:WD.chests.length
    });
  }
  return out;
},towerFloors);
for(const r of towerResults){
  ok(`${r.f}층: cosmos 비옴 강제`, r.biomeId==='cosmos', r.biomeId);
  ok(`${r.f}층: 몬스터 전부 cosmos_*`, r.mobKeys.every(k=>k.startsWith('cosmos_')), r.mobKeys.join(','));
  ok(`${r.f}층: 보스도 cosmos_11`, r.bossKey==='cosmos_11', r.bossKey);
  ok(`${r.f}층: 허공(void) 우세`, r.cnt.w/r.totalTiles>0.35, `${(r.cnt.w/r.totalTiles*100).toFixed(0)}%`);
  ok(`${r.f}층: 스폰/아레나/탈출구/아레나문 도달가능`, r.spawnOk&&r.arenaOk&&r.exitGateOk&&r.arenaGateOk);
  ok(`${r.f}층: 캠프 전부(${r.campsN}) 도달가능`, r.campsOk);
  ok(`${r.f}층: 보물상자 전부(${r.chestsN}) 도달가능`, r.chestsOk);
}
{
  const uniq=new Set(towerResults.map(r=>JSON.stringify(r.cnt))).size;
  ok('탑 층마다 지형이 실제로 달라짐', uniq>=Math.min(6,towerResults.length-2), `유니크 ${uniq}/${towerResults.length}`);
}

console.log('\n[2] 본편 챕터 회귀 확인 (공유 함수 수정이 본편에 영향 없어야 함)');
const campaignFloors=[0,1,5,9,10,19,20,50,100,150,199];
const campaignResults=await p.evaluate((chaps)=>{
  const T=window.__TORI;
  T.TW.on=0;
  const out=[];
  for(const c of chaps){
    T.enterChapter(c);
    const WD=T.WD, tiles=Array.from(WD.tiles);
    const cnt={w:0}; for(const v of tiles) if(v===3) cnt.w++;
    const mobKeys=T.chapMobs(c);
    out.push({ c, biomeId:mobKeys[0].split('_')[0],
      expectBi:Math.min(T.BIOME.length-1, Math.floor(c/10)),
      bi:T.BIOME.findIndex(x=>x.id===mobKeys[0].split('_')[0]),
      voidRatio:cnt.w/tiles.length });
  }
  return out;
},campaignFloors);
for(const r of campaignResults){
  ok(`챕터${r.c}: chapBiome 공식 그대로(${r.expectBi})`, r.bi===r.expectBi, `실제=${r.bi}`);
  ok(`챕터${r.c}: cosmos 아님(본편은 절대 우주 안 나옴)`, r.biomeId!=='cosmos', r.biomeId);
  ok(`챕터${r.c}: 허공 비율 정상`, r.voidRatio<0.35, `${(r.voidRatio*100).toFixed(0)}%`);
}

console.log('\n[3] 에러 로그');
ok('pageerror/console error 0건', p.__errs.length===0, p.__errs.slice(0,5).join(' | '));

console.log(`\n총 ${pass+fail}건 중 통과 ${pass} / 실패 ${fail}`);
await b.close();
process.exit(fail>0?1:0);
})();
