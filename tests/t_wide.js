const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{
  const T=window.__TORI, COLS=28, ROWS=22;
  let worstNarrow=0, worstChap=0, totalNarrow=0, minFree=9999, bad=[];
  for(let c=0;c<110;c++){
    T.enterChapter(c);
    const t=T.WD.tiles;
    const walk=(x,y)=>{ if(x<1||y<1||x>=COLS-1||y>=ROWS-1) return false;
      const v=t[y*COLS+x]; return !(v===5||v===3); };
    const in2=(x,y)=>{ const o=[[0,0],[-1,0],[0,-1],[-1,-1]];
      for(const q of o){ const a=x+q[0],b2=y+q[1];
        if(walk(a,b2)&&walk(a+1,b2)&&walk(a,b2+1)&&walk(a+1,b2+1)) return true; } return false; };
    let narrow=0, free=0;
    for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){
      if(!walk(x,y)) continue; free++;
      if(!in2(x,y)) narrow++;
    }
    totalNarrow+=narrow;
    if(narrow>worstNarrow){worstNarrow=narrow; worstChap=c+1;}
    if(free<minFree) minFree=free;
    if(narrow>0) bad.push((c+1)+'장:'+narrow);
  }
  return {worstNarrow, worstChap, totalNarrow, minFree, bad:bad.slice(0,10), n:bad.length};
});
console.log('=== 110개 맵 길목 폭 검사 (2칸 미만 통로) ===');
console.log('  1칸짜리 좁은 통로 총 '+r.totalNarrow+'칸  (문제 맵 '+r.n+'개)');
console.log('  최악: '+r.worstChap+'장 '+r.worstNarrow+'칸   '+(r.bad.length?r.bad.join(' '):''));
console.log('  가장 좁은 맵의 걸을 수 있는 칸: '+r.minFree);
console.log(r.totalNarrow===0? '  ✅ 모든 길이 최소 2칸 폭' : '  ⚠ 아직 좁은 곳 있음');
await b.close();})();
