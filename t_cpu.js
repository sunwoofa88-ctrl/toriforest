/* CDP JS 프로파일러 : 함수별 self-time. 래스터(그리기) 비용과 로직 비용을 분리한다.
   래스터는 기기마다 다르지만 '자바스크립트 로직'은 실기에도 그대로 옮겨간다. */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 await p.goto(F);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.S.mobLots=1;T.beginPlay();});
 await p.waitForTimeout(2500);
 // 실전 상황 만들기 : 몬스터 가득 + 계속 공격
 await p.evaluate(()=>{const T=window.__TORI;
   for(let i=0;i<40;i++) T.spawnEnemy();
   window.__atk=setInterval(()=>{ let g=null,d=1e9;
     for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
     if(g)T.doAttack(g.x,g.y-g.size*0.5); },120);});
 await p.waitForTimeout(1500);

 const cdp=await p.context().newCDPSession(p);
 await cdp.send('Profiler.enable');
 await cdp.send('Profiler.setSamplingInterval',{interval:100});   // 0.1ms
 await cdp.send('Profiler.start');
 await p.waitForTimeout(9000);
 const {profile}=await cdp.send('Profiler.stop');
 await p.evaluate(()=>clearInterval(window.__atk));

 // self-time 집계
 const byId={}; for(const n of profile.nodes) byId[n.id]=n;
 const self={};
 const total=profile.samples.length;
 const dt=(profile.endTime-profile.startTime)/1000/total;   // ms per sample
 for(const s of profile.samples){
   const n=byId[s]; if(!n) continue;
   const cf=n.callFrame;
   let name=cf.functionName||'(anonymous)';
   const url=(cf.url||'').split('/').pop()||'';
   if(!cf.url) name='(native) '+name;
   else if(!name) name='(anon)';
   const key=name+(url&&url!=='dotorisup.html'? ' @'+url : '');
   self[key]=(self[key]||0)+1;
 }
 const rows=Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,28);
 const stat=await p.evaluate(()=>({aq:window.__TORI.dbg.aqStat(), en:window.__TORI.EN.filter(e=>e.alive&&!e.dead).length, pt:window.__TORI.particleCount(), fc:window.__TORI.dbg.frameCount()}));
 console.log(`샘플 ${total}개 · ${(dt*1000).toFixed(0)}µs/샘플 · 적 ${stat.en} 파티클 ${stat.pt} 품질 ${stat.aq.n!==undefined?'':''}`);
 console.log('가산면적 '+Math.round(stat.aq.area/1000)+'k / soft '+Math.round(stat.aq.soft/1000)+'k, 컷 '+stat.aq.cut);
 console.log('─'.repeat(72));
 for(const [k,v] of rows)
   console.log(String((100*v/total).toFixed(1)).padStart(5)+'%  '+String((v*dt).toFixed(0)).padStart(5)+'ms  '+k);
 await b.close();
})();
