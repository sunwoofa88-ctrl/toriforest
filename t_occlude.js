/* 가림 실측 : HUD 가 맵·캐릭터·몬스터를 얼마나 덮는가 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const CASES=[['폰 세로',412,915,2.6],['A9+ 가로',1280,800,1.5],['A9+ 세로',800,1280,1.5],['작은폰 세로',360,740,3]];
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 for(const [nm,w,h,d] of CASES){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=25;T.beginPlay();});
  await p.waitForTimeout(1800);
  await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<12;i++)T.spawnEnemy();});
  await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{
    const T=window.__TORI;
    const W=innerWidth,H=innerHeight;
    /* HUD 로 덮인 픽셀을 실제로 센다 (겹침은 한 번만) */
    const grid=new Uint8Array(Math.ceil(W/4)*Math.ceil(H/4));
    const GW=Math.ceil(W/4);
    let opaque=0;
    document.querySelectorAll('body *').forEach(e=>{
      if(e.tagName==='CANVAS') return;
      const cs=getComputedStyle(e);
      if(cs.display==='none'||cs.visibility==='hidden') return;
      const al=parseFloat(cs.opacity);
      if(!(al>0.25)) return;
      /* 배경이 실제로 칠해져 있는 것만 (투명 컨테이너 제외) */
      const bg=cs.backgroundColor, bi=cs.backgroundImage;
      const hasBg = (bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent') || (bi && bi!=='none');
      if(!hasBg) return;
      const b=e.getBoundingClientRect();
      if(b.width<4||b.height<4) return;
      /* 화면 전체를 덮는 것은 HUD 가 아니라 바탕 컨테이너다 — 빼야 한다 */
      if(b.width*b.height > W*H*0.55) return;
      if(b.width>=W*0.98 && b.height>=H*0.98) return;
      for(let y=Math.max(0,b.top); y<Math.min(H,b.bottom); y+=4)
        for(let x=Math.max(0,b.left); x<Math.min(W,b.right); x+=4){
          const i=((y/4)|0)*GW+((x/4)|0);
          if(!grid[i]){ grid[i]=1; opaque++; }
        }
    });
    const total=Math.ceil(W/4)*Math.ceil(H/4);
    /* 주인공·몬스터가 HUD 아래 들어가 있나 */
    const cam={x:0,y:0};
    function covered(sx,sy){
      const i=((Math.max(0,Math.min(H-1,sy))/4)|0)*GW+((Math.max(0,Math.min(W-1,sx))/4)|0);
      return !!grid[i];
    }
    const T2=window.__TORI;
    const camx=T2.P.x-W/2, camy=T2.P.y-H/2;   /* 근사 */
    let hidden=0, tot=0;
    for(const e of T2.EN){ if(!e.alive||e.dead) continue;
      const sx=e.x-camx, sy=e.y-camy;
      if(sx<0||sx>W||sy<0||sy>H) continue;
      tot++; if(covered(sx,sy)) hidden++;
    }
    const heroHidden = covered(W/2, H/2);
    return { W,H, hudPct:+(100*opaque/total).toFixed(1),
             onScreen:tot, hidden, heroHidden,
             topBar: (()=>{const e=document.querySelector('.hud'); if(!e)return 0; const b=e.getBoundingClientRect(); return Math.round(b.height);})(),
             dock: (()=>{const e=document.querySelector('.dock'); if(!e)return 0; const b=e.getBoundingClientRect(); return Math.round(b.height);})() };
  });
  const ok = r.hudPct<=22 && !r.heroHidden && r.hidden===0;
  console.log(`${ok?'✅':'⚠️'} ${nm.padEnd(11)} ${r.W}×${r.H}  HUD 점유 ${String(r.hudPct).padStart(5)}%  화면 안 몬스터 ${r.onScreen}마리 중 가림 ${r.hidden}  주인공가림 ${r.heroHidden?'예':'아니오'}  상단바 ${r.topBar}px 하단 ${r.dock}px`);
  await p.close();
 }
 await b.close();
})();
