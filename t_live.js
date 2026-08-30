const {chromium}=require('playwright');
/* 실전 끼임 테스트 : 실제 조이스틱으로 오래 돌아다니며 정체 구간을 잡는다 */
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const e=[];p.on('pageerror',x=>{if(e.indexOf(x.message)<0)e.push(x.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(800);

const SX=100,SY=640;
let worst=0, stalls=[], chapTried=[];
for(const chap of [0,27,58,86,105]){
  await p.evaluate(c=>window.__TORI.enterChapter(c),chap);
  await p.waitForTimeout(700);
  await p.mouse.move(SX,SY); await p.mouse.down();
  let lastPos=null, stallFrames=0, maxStall=0, forced=0, where='-';
  // 맵 곳곳을 목표로 주고 실제로 이동되는지 본다
  const targets=await p.evaluate(()=>{
    const T=window.__TORI, WD=T.WD, out=[];
    out.push([WD.spawn.x,WD.spawn.y,'스폰']);
    WD.camps.forEach((c,i)=>out.push([c.x,c.y,'캠프'+i]));
    WD.chests.forEach((c,i)=>out.push([c.x,c.y,'상자'+i]));
    out.push([WD.arena.x,WD.arena.y,'아레나']); out.push([WD.exitGate.x,WD.exitGate.y,'출구문']);
    out.push([300,300,'좌상'],[1500,1100,'우하']);
    return out;
  });
  for(const tg of targets){
    for(let i=0;i<90;i++){
      const r=await p.evaluate(([tx,ty])=>{
        const T=window.__TORI,P=T.P; P.invT=9;
        const dx=tx-P.x, dy=ty-P.y, d=Math.hypot(dx,dy)||1;
        return {ux:dx/d,uy:dy/d,d:d,x:P.x,y:P.y,stuck:T.dbg.blocked(P.x,P.y,20*T.SC)};
      },tg);
      if(r.d<70) break;
      if(lastPos){
        const mv=Math.hypot(r.x-lastPos.x, r.y-lastPos.y);
        if(mv<0.8){ stallFrames++; if(stallFrames>maxStall){ maxStall=stallFrames; where=tg[2]+'@'+Math.round(r.x)+','+Math.round(r.y)+' 남은거리'+Math.round(r.d); } }
        else stallFrames=0;
      }
      lastPos={x:r.x,y:r.y};
      await p.mouse.move(SX+r.ux*46, SY+r.uy*46);
      await p.waitForTimeout(24);
    }
  }
  await p.mouse.up();
  const st=await p.evaluate(()=>({stuck:window.__TORI.dbg.blocked(window.__TORI.P.x,window.__TORI.P.y,20*window.__TORI.SC)}));
  chapTried.push({c:chap+1, maxStall, endStuck:st.stuck, where});
  if(maxStall>worst) worst=maxStall;
  if(maxStall>28) stalls.push(chap+1);
}
console.log('장별 최장 정체(프레임, 1프레임≈30ms):');
chapTried.forEach(r=>console.log('  '+String(r.c).padStart(3)+'장  정체 '+String(r.maxStall).padStart(3)+'  종료시갇힘 '+r.endStuck));
console.log('\n최악 정체:',worst,'프레임 ≈',(worst*0.03).toFixed(1),'초');
console.log('심각 정체(28프레임=0.85초 초과) 발생 장:', stalls.length?stalls.join(','):'없음');
console.log(e.length?'ERR '+e.join('|'):'에러 없음');
await b.close();})();
