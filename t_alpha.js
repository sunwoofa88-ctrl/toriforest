/* 투명도 전수 검증 : 모든 그리기 호출 시점의 globalAlpha 를 호출부별로 수집 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
 await p.waitForTimeout(2200);
 await p.evaluate(()=>{const T=window.__TORI;
   for(let i=0;i<20;i++)T.spawnEnemy();
   for(let i=0;i<6;i++) T.dropLoot&&T.dropLoot(T.P.x+(Math.random()-0.5)*300,T.P.y+(Math.random()-0.5)*200);
   window.__atk=setInterval(()=>{let g=null,d=1e9;
     for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
     if(g)T.doAttack(g.x,g.y-g.size*0.5);},130);});
 await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>new Promise(res=>{
   const C=CanvasRenderingContext2D.prototype;
   const oDraw=C.drawImage, oFill=C.fillRect, oSave=C.save, oRest=C.restore;
   const site={};                       // 호출부 → 투명도 값 집계
   let depth=0, maxDepth=0, endDepth=[];
   function caller(){
     const st=new Error().stack.split('\n');
     for(let i=1;i<st.length;i++){
       const m=st[i].match(/at ([A-Za-z0-9_$.<>]+)\s/); if(!m) continue;
       const n=m[1];
       if(n==='caller'||n==='rec'||n.indexOf('C.')===0||n==='Object.rec') continue;
       return n;
     }
     return '?';
   }
   function rec(kind){
     const k=caller()+'|'+kind, a=Math.round(this.globalAlpha*100)/100;
     (site[k]=site[k]||{})[a]=(site[k][a]||0)+1;
   }
   C.drawImage=function(){ rec.call(this,'img'); return oDraw.apply(this,arguments); };
   C.fillRect =function(){ rec.call(this,'rect'); return oFill.apply(this,arguments); };
   C.save=function(){ depth++; if(depth>maxDepth)maxDepth=depth; return oSave.apply(this,arguments); };
   C.restore=function(){ depth--; return oRest.apply(this,arguments); };
   const f0=window.__TORI.dbg.frameCount();
   const iv=setInterval(()=>{ endDepth.push(depth); },100);   // 프레임 사이 save 스택 잔량
   setTimeout(()=>{
     clearInterval(iv);
     C.drawImage=oDraw; C.fillRect=oFill; C.save=oSave; C.restore=oRest;
     res({ site, maxDepth, endDepth:[...new Set(endDepth)],
           frames:window.__TORI.dbg.frameCount()-f0 });
   },4000);
 }));
 console.log('save 스택 최대 깊이:',r.maxDepth,' 프레임 사이 잔량:',r.endDepth.join(','), r.endDepth.every(v=>v===0)?'✅ 짝 맞음':'❌ 누수');
 console.log('\n호출부별 그리기 투명도:');
 const rows=Object.entries(r.site).sort();
 for(const [k,v] of rows){
   const vals=Object.entries(v).sort((a,b)=>b[1]-a[1]).map(([a,n])=>`${a}×${n}`).join(' ');
   console.log('  '+k.padEnd(28)+vals);
 }
 console.log('\nerrors:',errs.length?errs.slice(0,3):'none');
 await b.close();
})();
