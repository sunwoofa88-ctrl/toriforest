/* 캔버스 호출을 '어느 함수가' 내는지 호출부별로 집계 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox','--disable-frame-rate-limit']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 await p.goto(F);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(2000);
 await p.evaluate(()=>{const T=window.__TORI;
   for(let i=0;i<40;i++)T.spawnEnemy();
   window.__atk=setInterval(()=>{let g=null,d=1e9;
     for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
     if(g)T.doAttack(g.x,g.y-g.size*0.5);},120);});
 await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>new Promise(res=>{
   const C=CanvasRenderingContext2D.prototype;
   const site={};                       // "종류|함수명" → 횟수
   function caller(){
     const st=new Error().stack.split('\n');
     // 0:Error 1:caller 2:래퍼 3:진짜 호출부
     for(let i=3;i<st.length;i++){
       const m=st[i].match(/at ([A-Za-z0-9_$.]+)\s/);
       if(m && m[1]!=='caller') return m[1];
     }
     return '?';
   }
   const wrap=['drawImage','fill','stroke','fillRect','fillText','strokeText','save','restore','setTransform','beginPath','ellipse','arc'];
   const orig={};
   for(const n of wrap){ orig[n]=C[n]; C[n]=function(){ const k=n+'|'+caller(); site[k]=(site[k]||0)+1; return orig[n].apply(this,arguments); }; }
   const dGA=Object.getOwnPropertyDescriptor(C,'globalAlpha');
   Object.defineProperty(C,'globalAlpha',{get:dGA.get,configurable:true,
     set:function(v){ const k='globalAlpha|'+caller(); site[k]=(site[k]||0)+1; dGA.set.call(this,v); }});
   const f0=window.__TORI.dbg.frameCount();
   setTimeout(()=>{
     const frames=window.__TORI.dbg.frameCount()-f0;
     for(const n of wrap) C[n]=orig[n];
     Object.defineProperty(C,'globalAlpha',dGA);
     const rows=Object.entries(site).map(([k,v])=>[k,+(v/frames).toFixed(1)])
       .filter(([k,v])=>v>=2).sort((a,b)=>b[1]-a[1]);
     res({frames,rows,total:Math.round(Object.values(site).reduce((a,c)=>a+c,0)/frames)});
   },4000);
 }));
 console.log('프레임당 총 '+r.total+'개\n'+'─'.repeat(56));
 for(const [k,v] of r.rows) console.log(String(v).padStart(6)+'  '+k);
 await b.close();
})();
