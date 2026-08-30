const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(600);
const r=await p.evaluate(()=>{
  const T=window.__TORI;
  const sigs=new Set(), out=[], bad=[];
  const combo={};
  for(let c=0;c<110;c++){
    T.enterChapter(c);
    const WD=T.WD;
    // 지형 지문 : 타일 배열 해시
    let h=0; for(let i=0;i<WD.tiles.length;i+=1) h=(h*33 + WD.tiles[i])|0;
    sigs.add(h);
    // 통계
    let free=0, water=0, rock=0, path=0, tall=0, sand=0;
    for(let i=0;i<WD.tiles.length;i++){const t=WD.tiles[i];
      if(t===3)water++; else if(t===5)rock++; else if(t===1)path++;
      else if(t===2)tall++; else if(t===4)sand++;}
    const rad=20*T.SC;
    for(let ty=1;ty<21;ty++)for(let tx=1;tx<27;tx++)
      if(!T.dbg.blocked((tx+0.5)*64,(ty+0.5)*64,rad)) free++;
    // 도달성 : 스폰에서 모든 목표까지
    const pts=[[WD.arena.x,WD.arena.y,'아레나'],[WD.exitGate.x,WD.exitGate.y,'출구'],
               [WD.arenaGate.x,WD.arenaGate.y,'보스문']];
    WD.camps.forEach((q,i)=>pts.push([q.x,q.y,'캠프'+i]));
    WD.chests.forEach((q,i)=>pts.push([q.x,q.y,'상자'+i]));
    // BFS
    const _D=T.dbg.dims(); const COLS=_D.COLS, ROWS=_D.ROWS, _TS=_D.TS, _WW=_D.WW, _WH=_D.WH;
    const walk=(tx,ty)=>{ if(tx<1||ty<1||tx>=COLS-1||ty>=ROWS-1)return false;
      const t=WD.tiles[ty*COLS+tx]; return !(t===5||t===3); };
    const sx=Math.floor(WD.spawn.x/64), sy=Math.floor(WD.spawn.y/64);
    const seen=new Uint8Array(COLS*ROWS), q2=[sy*COLS+sx];
    if(walk(sx,sy)) seen[sy*COLS+sx]=1; 
    for(let qi=0;qi<q2.length;qi++){
      const v=q2[qi], vx=v%COLS, vy=(v/COLS)|0;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
        const nx=vx+d[0], ny=vy+d[1];
        if(nx<0||ny<0||nx>=COLS||ny>=ROWS)return;
        if(seen[ny*COLS+nx]||!walk(nx,ny))return;
        seen[ny*COLS+nx]=1; q2.push(ny*COLS+nx);});
    }
    pts.forEach(pt=>{
      const gx=Math.min(COLS-2,Math.max(1,Math.floor(pt[0]/_TS)));
      const gy=Math.min(ROWS-2,Math.max(1,Math.floor(pt[1]/_TS)));
      if(!seen[gy*COLS+gx]) bad.push((c+1)+'장 '+pt[2]+' 도달불가');
      if(pt[0]<0||pt[1]<0||pt[0]>_WW||pt[1]>_WH) bad.push((c+1)+'장 '+pt[2]+' 맵밖');
    });
    if(free<120) bad.push((c+1)+'장 걸을 수 있는 칸 '+free+'개뿐');
    const key=T.chapTerrain(c)+'-'+T.chapLayout(c);
    combo[key]=(combo[key]||0)+1;
    out.push({c:c+1, terr:T.chapTerrain(c), lay:T.chapLayout(c), free, water, rock, path, tall, sand});
  }
  return {distinct:sigs.size, out, bad, combos:Object.keys(combo).length};
});
console.log('=== 110개 맵 검사 ===');
console.log('  서로 다른 지형: '+r.distinct+' / 110');
console.log('  지형×배치 조합 종류: '+r.combos+'가지');
console.log('  문제: '+(r.bad.length? r.bad.slice(0,12).join(' / ') : '없음'));
const sample=[0,1,2,3,4,5,6,7,9,19,29,49,79,109];
console.log('  장   지형 배치  자유칸  물  바위  길  수풀 모래');
sample.forEach(i=>{const x=r.out[i];
  console.log('  '+String(x.c).padStart(3)+'    '+x.terr+'    '+x.lay+'   '+String(x.free).padStart(4)+
    '  '+String(x.water).padStart(3)+' '+String(x.rock).padStart(4)+' '+String(x.path).padStart(4)+
    ' '+String(x.tall).padStart(4)+' '+String(x.sand).padStart(4));});
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
