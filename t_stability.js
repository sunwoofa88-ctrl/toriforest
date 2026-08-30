/* 장시간 안정성 : 힙·스프라이트캐시·풀·타이머·리스너가 계속 늘어나는지 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--js-flags=--expose-gc']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push(m.text());});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();
   // 타이머·리스너 개수를 세기 위해 감시를 건다
   window.__t=0; const oT=window.setTimeout, cT=window.clearTimeout;
   window.setTimeout=function(){ window.__t++; return oT.apply(this,arguments); };
   window.__liveT=0;
   const oI=window.setInterval; window.__iv=0;
   window.setInterval=function(){ window.__iv++; return oI.apply(this,arguments); };
   window.__el=0; const oA=EventTarget.prototype.addEventListener, oR=EventTarget.prototype.removeEventListener;
   EventTarget.prototype.addEventListener=function(){ window.__el++; return oA.apply(this,arguments); };
   EventTarget.prototype.removeEventListener=function(){ window.__el--; return oR.apply(this,arguments); };
   // 계속 싸운다 + 장 이동도 섞는다
   window.__atk=setInterval(()=>{ try{
     const T=window.__TORI;
     if(T.EN.filter(e=>e.alive&&!e.dead).length<24) for(let i=0;i<4;i++) T.spawnEnemy();
     let g=null,d=1e9;
     for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
     if(g) T.doAttack(g.x,g.y-g.size*0.5);
     if(Math.random()<0.02){ T.S.ult=100; T.doUlt(); }
   }catch(e){} },110);
 });
 const snap=async(label)=>{
   const r=await p.evaluate(()=>{
     const T=window.__TORI;
     if(window.gc) window.gc();
     return { heap: performance.memory? Math.round(performance.memory.usedJSHeapSize/1048576):-1,
       mobCache: Object.keys(T.dbg.MOB_CACHE||{}).length,
       tint: T.dbg.aqStat().tint,
       pt: T.particleCount(),
       en: T.EN.filter(e=>e.alive&&!e.dead).length,
       pr: T.dbg.PR? T.dbg.PR.filter(x=>x.alive).length : -1,
       timers: window.__t, intervals: window.__iv, listeners: window.__el,
       frames: T.dbg.frameCount(), chap: T.S.chap };
   });
   console.log(`${label.padEnd(8)} 힙 ${String(r.heap).padStart(3)}MB · 몹캐시 ${r.mobCache} · 틴트 ${r.tint} · 파티클 ${r.pt} · 적 ${r.en} · 투사체 ${r.pr} · setTimeout누적 ${r.timers} · setInterval ${r.intervals} · 리스너 ${r.listeners} · 장 ${r.chap}`);
   return r;
 };
 await p.waitForTimeout(4000);
 const a=await snap('0분');
 for(const t of [1,2,3,4]){
   // 장 이동도 시켜 본다 (월드 재생성 = 누수 나기 쉬운 지점)
   await p.evaluate(c=>{ try{ window.__TORI.enterChapter(c); }catch(e){} }, t*3);
   await p.waitForTimeout(60000);
   var last=await snap(t+'분');
 }
 await p.evaluate(()=>clearInterval(window.__atk));
 console.log('\n힙 증가:', last.heap-a.heap, 'MB   몹캐시 증가:', last.mobCache-a.mobCache,
             '  리스너 증가:', last.listeners-a.listeners, '  interval 증가:', last.intervals-a.intervals);
 console.log('오류:', errs.length? errs.slice(0,4):'없음');
 await b.close();
})();
