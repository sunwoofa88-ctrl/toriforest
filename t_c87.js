const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{
  const T=window.__TORI; T.enterChapter(86);
  const WD=T.WD, out={targets:[],tiles:{}};
  const names=['spawn','camp0','camp1','camp2','chest0','chest1','chest2','arena','exitGate'];
  const pts=[[WD.spawn.x,WD.spawn.y]];
  WD.camps.forEach(c=>pts.push([c.x,c.y]));
  WD.chests.forEach(c=>pts.push([c.x,c.y]));
  pts.push([WD.arena.x,WD.arena.y]); pts.push([WD.exitGate.x,WD.exitGate.y]);
  const rad=20*T.SC;
  pts.forEach((q,i)=>{
    // 도달 가능? 스폰에서 타일 플러드필
    out.targets.push({n:names[i]||('p'+i), x:Math.round(q[0]), y:Math.round(q[1]),
      blocked:T.dbg.blocked(q[0],q[1],rad), tile:T.dbg.tileAt?T.dbg.tileAt(q[0],q[1]):-1});
  });
  // 솔리드 소품 통계
  const cnt={};
  WD.props.forEach(pr=>{ if(pr.solid) cnt[pr.k]=(cnt[pr.k]||0)+1; });
  out.solids=cnt;
  // 걸을 수 있는 칸 수
  let free=0,tot=0;
  for(let ty=1;ty<22-1;ty++)for(let tx=1;tx<28-1;tx++){tot++;
    if(!T.dbg.blocked((tx+0.5)*64,(ty+0.5)*64,rad)) free++;}
  out.free=free; out.tot=tot;
  return out;
});
console.log(JSON.stringify(r,null,1));
await b.close();})();
