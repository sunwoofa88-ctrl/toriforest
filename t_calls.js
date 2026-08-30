/* 프레임당 캔버스 명령 수 — 모바일 Skia 에서 프레임을 결정하는 진짜 지표.
   drawImage 수보다 '상태 변경(save/restore/setTransform/globalAlpha/합성모드)'과
   경로연산(fill/stroke/ellipse/arc/roundRect)이 훨씬 비싸다. */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
async function measure(p,label,setup,secs){
  if(setup) await p.evaluate(setup);
  await p.waitForTimeout(500);
  const r=await p.evaluate(s=>new Promise(res=>{
    const C=CanvasRenderingContext2D.prototype;
    const names=['drawImage','fill','stroke','fillRect','strokeRect','fillText','strokeText',
                 'save','restore','setTransform','translate','rotate','scale','beginPath',
                 'ellipse','arc','roundRect','moveTo','lineTo','quadraticCurveTo','bezierCurveTo',
                 'clip','createLinearGradient','createRadialGradient','putImageData','getImageData'];
    const cnt={}, orig={};
    for(const n of names){ if(typeof C[n]!=='function') continue;
      orig[n]=C[n]; cnt[n]=0;
      C[n]=function(){ cnt[n]++; return orig[n].apply(this,arguments); }; }
    // globalAlpha / globalCompositeOperation 설정 횟수
    let ga=0,gco=0;
    const dGA=Object.getOwnPropertyDescriptor(C,'globalAlpha');
    const dCO=Object.getOwnPropertyDescriptor(C,'globalCompositeOperation');
    Object.defineProperty(C,'globalAlpha',{get:dGA.get,set:function(v){ga++;dGA.set.call(this,v);},configurable:true});
    Object.defineProperty(C,'globalCompositeOperation',{get:dCO.get,set:function(v){gco++;dCO.set.call(this,v);},configurable:true});
    let f0=window.__TORI.dbg.frameCount(), t0=performance.now();
    setTimeout(()=>{
      const frames=window.__TORI.dbg.frameCount()-f0, ms=performance.now()-t0;
      for(const n in orig) C[n]=orig[n];
      Object.defineProperty(C,'globalAlpha',dGA);
      Object.defineProperty(C,'globalCompositeOperation',dCO);
      const per={}; for(const n in cnt) if(cnt[n]>0) per[n]=+(cnt[n]/frames).toFixed(1);
      per['globalAlpha=']=+(ga/frames).toFixed(1); per['합성모드=']=+(gco/frames).toFixed(1);
      const tot=Object.values(per).reduce((a,c)=>a+c,0);
      res({frames, fps:Math.round(frames/(ms/1000)), per, 합계:Math.round(tot),
           en:window.__TORI.EN.filter(e=>e.alive&&!e.dead).length,
           pt:window.__TORI.particleCount()});
    },s);
  }),secs*1000);
  const top=Object.entries(r.per).filter(([k,v])=>v>=1).sort((a,b)=>b[1]-a[1]);
  console.log(`\n■ ${label}   ${r.fps}fps · 적${r.en} 파티클${r.pt} · 프레임당 캔버스명령 총 ${r.합계}개`);
  console.log('   '+top.map(([k,v])=>k+'='+v).join('  '));
  return r;
}
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 await p.goto(F);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(2000);
 await measure(p,'빈 화면 (적 없음)',()=>{const T=window.__TORI;T.dbg.setRoam(0);for(const e of T.EN)e.alive=false;},4);
 await measure(p,'적 12마리',()=>{const T=window.__TORI;for(let i=0;i<12;i++)T.spawnEnemy();},4);
 await measure(p,'적 40마리',()=>{const T=window.__TORI;for(let i=0;i<28;i++)T.spawnEnemy();},4);
 await measure(p,'적 40 + 계속공격',()=>{const T=window.__TORI;
   window.__atk=setInterval(()=>{let g=null,d=1e9;
     for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
     if(g)T.doAttack(g.x,g.y-g.size*0.5);},120);},5);
 await b.close();
})();
