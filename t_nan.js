/* 수치 오염 감시 : NaN / Infinity 가 어디서든 생기면 잡는다 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>new Promise(res=>{
   const T=window.__TORI, D=T.dbg;
   const bad=new Map();
   function chk(where,obj,keys){
     for(const k of keys){
       const v=obj[k];
       if(typeof v==='number' && !isFinite(v)){
         const id=where+'.'+k;
         if(!bad.has(id)) bad.set(id,{n:0,v:String(v)});
         bad.get(id).n++;
       }
     }
   }
   const PK=['x','y','vx','vy','size','hp','atk','bob','step','squash','fx','fy','invT','hurtT','atkT','inhaleT','deadT'];
   const EK=['x','y','vx','vy','hp','hpMax','atk','spd','size','hover','kbx','kby','poise','groggy','stun','freeze','act','tele','wt','hx','hy'];
   const RK=['x','y','vx','vy','life','r','rot','dmg','z','gr','spin'];
   const TK=['x','y','vx','vy','life','size','rot','fade','grow'];
   const SK=['lv','xp','acorn','star','chap','stage'];
   let ticks=0;
   const iv=setInterval(()=>{
     try{
       ticks++;
       chk('P',T.P,PK);
       chk('HP',{hp:D.HP,max:D.maxHp(),ratio:D.hpRatio()},['hp','max','ratio']);
       chk('S',T.S,SK);
       for(const e of T.EN) if(e.alive) chk('EN',e,EK);
       for(const q of D.PR) if(q.alive) chk('PR',q,RK);
       for(const q of T.PT) if(q.alive) chk('PT',q,TK);
       chk('cam',{x:0},['x']);
       // 계속 격렬하게 논다
       if(T.EN.filter(e=>e.alive&&!e.dead).length<22) for(let i=0;i<4;i++) T.spawnEnemy();
       let g=null,d=1e9;
       for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
       if(g) T.doAttack(g.x,g.y-g.size*0.5);
       if(ticks%40===0){ T.S.ult=100; T.doUlt(); }
       if(ticks%90===0){ try{ T.enterChapter((ticks/90)|0); }catch(e){} }
       // 극단값 주입 : 0 나눗셈·음수가 전파되는지
       if(ticks===60){ T.S.lv=1; }
       if(ticks===120){ T.S.lv=999; }
       if(ticks===180){ T.dbg.hurtPlayer&&0; T.P.vx=0; }
     }catch(e){ if(!bad.has('예외')) bad.set('예외',{n:0,v:e.message}); bad.get('예외').n++; }
   },60);
   setTimeout(()=>{ clearInterval(iv);
     res({ticks, bad:[...bad.entries()].map(([k,v])=>k+' ×'+v.n+' ('+v.v+')')});
   },30000);
 }));
 console.log('감시 '+r.ticks+'회');
 console.log(r.bad.length? '❌ 수치 오염:\n  '+r.bad.join('\n  ') : '✅ NaN/Infinity 없음');
 console.log('예외:', errs.length? errs.slice(0,4):'없음');
 await b.close();
})();
