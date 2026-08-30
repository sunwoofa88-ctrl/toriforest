const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const e=[];p.on('pageerror',x=>{if(e.indexOf(x.message)<0)e.push(x.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.beginPlay();});
await p.waitForTimeout(900);

const rep=await p.evaluate(()=>{
  const T=window.__TORI, out={};
  const chaps=[0,5,17,33,49,66,82,95,103,109];
  out.perChap=[];
  for(const c of chaps){
    T.enterChapter(c);
    const WD=T.WD, R=T.dbg;
    // ① 스폰 지점이 막혀 있는가
    const spawnBlocked = R.blocked(WD.spawn.x, WD.spawn.y, 20*T.SC);
    // ② 보스 스폰 지점
    const bx=WD.arena.x+140, by=WD.arena.y-60;
    const bossR = Math.round(T.SPECIES[T.chapBoss(c)].sz*1.06*T.SC*0.28);
    const bossBlocked = R.blocked(bx,by,bossR);
    // ③ 상자 접근 가능성
    let chestBad=0;
    for(const ch of WD.chests){
      let ok=false;
      for(let a=0;a<16;a++){ const ang=a/16*6.2832;
        if(!R.blocked(ch.x+Math.cos(ang)*70, ch.y+Math.sin(ang)*70, 20*T.SC)){ ok=true;break; } }
      if(!ok) chestBad++;
    }
    // ④ 맵 전역 스캔 : 갇힌 칸(8방향 전부 막힘) 비율
    let free=0, trapped=0, sampled=0;
    for(let gy=2; gy<22; gy++) for(let gx=2; gx<28; gx++){
      const x=(gx+0.5)*64, y=(gy+0.5)*64;
      if(R.blocked(x,y,20*T.SC)) continue;
      free++; sampled++;
      let openDirs=0;
      for(let a=0;a<8;a++){ const ang=a/8*6.2832;
        if(!R.blocked(x+Math.cos(ang)*26, y+Math.sin(ang)*26, 20*T.SC)) openDirs++; }
      if(openDirs===0) trapped++;
    }
    // ⑤ 캠프 스폰 지점이 소품에 겹치는가
    let campBad=0;
    for(const cm of WD.camps){
      let bad=0;
      for(let k=0;k<24;k++){ const ang=Math.random()*6.2832, r=60+Math.random()*(cm.r-40);
        if(R.blocked(cm.x+Math.cos(ang)*r, cm.y+Math.sin(ang)*r, 24)) bad++; }
      if(bad>18) campBad++;
    }
    out.perChap.push({c:c+1, spawnBlocked, bossBlocked, chestBad, free, trapped, campBad});
  }
  return out;
});
console.log('장 | 스폰막힘 | 보스막힘 | 접근불가상자 | 자유칸 | 갇힌칸 | 문제캠프');
rep.perChap.forEach(r=>console.log(
  String(r.c).padStart(3),'|',String(r.spawnBlocked).padStart(8),'|',String(r.bossBlocked).padStart(8),'|',
  String(r.chestBad).padStart(12),'|',String(r.free).padStart(6),'|',String(r.trapped).padStart(6),'|',r.campBad));

// ⑥ 대시가 벽을 통과하는가
const dash=await p.evaluate(()=>{
  const T=window.__TORI, R=T.dbg;
  T.enterChapter(0);
  const P=T.P;
  // 벽(바위) 타일을 찾아 그 안으로 대시 목표 설정
  let wx=0,wy=0;
  outer: for(let gy=2;gy<22;gy++) for(let gx=2;gx<28;gx++){
    const x=(gx+0.5)*64,y=(gy+0.5)*64;
    if(R.blocked(x,y,20*T.SC)){ wx=x;wy=y;break outer; }
  }
  P.x=wx-200; P.y=wy;
  P.dashT=0.13; P.dashX=wx; P.dashY=wy;
  return {target:{x:Math.round(wx),y:Math.round(wy)}, before:{x:Math.round(P.x),y:Math.round(P.y)}};
});
await p.waitForTimeout(500);
const after=await p.evaluate(()=>{const T=window.__TORI,R=T.dbg;
  return {x:Math.round(T.P.x),y:Math.round(T.P.y), stuck:R.blocked(T.P.x,T.P.y,20*T.SC)};});
console.log('\n대시 벽 통과 테스트: 목표',JSON.stringify(dash.target),'→ 결과',JSON.stringify(after));

// ⑦ 갇힌 상태에서 탈출 가능한가
const escape=await p.evaluate(async()=>{
  const T=window.__TORI, R=T.dbg, P=T.P;
  let wx=0,wy=0;
  outer: for(let gy=2;gy<22;gy++) for(let gx=2;gx<28;gx++){
    const x=(gx+0.5)*64,y=(gy+0.5)*64;
    if(R.blocked(x,y,20*T.SC)){ wx=x;wy=y;break outer; }
  }
  P.x=wx; P.y=wy;            // 강제로 벽 안에 넣기
  const start={x:P.x,y:P.y};
  // 8방향 전부 밀어본다
  for(let t=0;t<120;t++){
    const a=(t%8)/8*6.2832;
    P.vx=Math.cos(a); P.vy=Math.sin(a);
    await new Promise(r=>setTimeout(r,16));
  }
  P.vx=0;P.vy=0;
  return {moved:Math.round(Math.hypot(P.x-start.x,P.y-start.y)), stillStuck:R.blocked(P.x,P.y,20*T.SC)};
});
console.log('갇힘 탈출 테스트:', JSON.stringify(escape));
console.log(e.length?'ERR '+e.join('|'):'에러 없음');
await b.close();})();
