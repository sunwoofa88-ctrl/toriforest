const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(500);
await p.evaluate(()=>window.__TORI.enterChapter(27));
await p.waitForTimeout(800);
const tg=await p.evaluate(()=>{const W=window.__TORI.WD;return [
  ['스폰',W.spawn.x,W.spawn.y],['캠프0',W.camps[0].x,W.camps[0].y],['캠프1',W.camps[1].x,W.camps[1].y],
  ['캠프2',W.camps[2].x,W.camps[2].y],['상자0',W.chests[0].x,W.chests[0].y],['상자1',W.chests[1].x,W.chests[1].y],
  ['상자2',W.chests[2].x,W.chests[2].y],['아레나',W.arena.x,W.arena.y],['출구문',W.exitGate.x,W.exitGate.y],
  ['좌상',300,300],['우하',1500,1100]];});
const SX=100,SY=640;
await p.mouse.move(SX,SY); await p.mouse.down();
for(const [name,tx,ty] of tg){
  let last=null, stall=0, maxStall=0, at=null;
  for(let i=0;i<90;i++){
    const r=await p.evaluate(([tx,ty])=>{
      const T=window.__TORI,P=T.P; P.invT=9;
      const dx=tx-P.x,dy=ty-P.y,d=Math.hypot(dx,dy)||1;
      return {ux:dx/d,uy:dy/d,d,x:P.x,y:P.y};
    },[tx,ty]);
    if(r.d<70) break;
    if(last){ const mv=Math.hypot(r.x-last.x,r.y-last.y);
      if(mv<0.8){ stall++; if(stall>maxStall){maxStall=stall; at={x:Math.round(r.x),y:Math.round(r.y),d:Math.round(r.d)};} }
      else stall=0; }
    last={x:r.x,y:r.y};
    await p.mouse.move(SX+r.ux*46,SY+r.uy*46);
    await p.waitForTimeout(24);
  }
  if(maxStall>10){
    const why=await p.evaluate(([x,y])=>{
      const T=window.__TORI, out=[];
      const near=T.dbg.propsNear(x,y,220,[]);
      near.forEach(pr=>{ if(!pr.solid)return;
        const dx=pr.x-x,dy=(pr.y-y)*1.5, d=Math.hypot(dx,dy);
        if(d<pr.r+60) out.push({k:pr.k,r:pr.r,d:Math.round(d)}); });
      const t=[];
      for(let oy=-1;oy<=1;oy++){const row=[];for(let ox=-1;ox<=1;ox++){
        row.push(T.dbg.solidAt(x+ox*64,y+oy*64)?'#':'.');} t.push(row.join(''));}
      return {props:out, tiles:t};
    },[at.x,at.y]);
    console.log(name.padEnd(6)+' 정체 '+String(maxStall).padStart(3)+'  위치('+at.x+','+at.y+') 남은거리 '+at.d+
      '  주변솔리드='+JSON.stringify(why.props)+'  지형 '+why.tiles.join('/'));
  } else {
    console.log(name.padEnd(6)+' 정체 '+String(maxStall).padStart(3)+'  정상');
  }
}
await p.mouse.up();
await b.close();})();
