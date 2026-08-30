const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(500);
await p.evaluate(()=>window.__TORI.enterChapter(27));
await p.waitForTimeout(800);
const tg=await p.evaluate(()=>{const c=window.__TORI.WD.camps[2];return [c.x,c.y];});
await p.mouse.move(100,640); await p.mouse.down();
let stall=0, log=[];
let last=null;
for(let i=0;i<200;i++){
  const r=await p.evaluate(([tx,ty])=>{
    const T=window.__TORI,P=T.P; P.invT=9;
    const dx=tx-P.x,dy=ty-P.y,d=Math.hypot(dx,dy)||1;
    return {ux:dx/d,uy:dy/d,d,x:P.x,y:P.y,
      state:T.G.state, fade:T.G.fade, vx:P.vx,vy:P.vy, moving:P.moving,
      stuck:T.dbg.blocked(P.x,P.y,20*T.SC), dead:P.dead, inv:P.invT,
      en:T.EN.filter(e=>e.alive&&!e.dead).length, sheet:T.sheetOpen};
  },tg);
  if(r.d<70) break;
  if(last){ const mv=Math.hypot(r.x-last.x,r.y-last.y);
    if(mv<0.8){ stall++; if(stall===25) log.push(JSON.stringify(r)); }
    else stall=0; }
  last={x:r.x,y:r.y};
  await p.mouse.move(100+r.ux*46,640+r.uy*46);
  await p.waitForTimeout(24);
}
await p.mouse.up();
console.log('정체 시점 상태:');
log.slice(0,4).forEach(x=>console.log('  '+x));
if(!log.length) console.log('  정체 없음');
await b.close();})();
