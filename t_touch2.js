/* 조작부 전체를 '진짜 터치'로 전수 검증 (갤탭 A9+ 가로/세로) */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
for(const [nm,w,h] of [['A9+ 가로 1280x800',1280,800],['A9+ 세로 800x1280',800,1280]]){
 console.log('\n══ '+nm+' ══');
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'});
 const p=await ctx.newPage();
 p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
 await p.goto(F);
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 const cdp=await ctx.newCDPSession(p);
 const T=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q.x,y:q.y,id:i+1}))});
 /* 시작도 진짜 터치로 */
 const ts=await p.evaluate(()=>{const q=document.getElementById('tapstart').getBoundingClientRect();
   return {x:q.left+q.width/2,y:q.top+q.height/2};});
 await T('touchStart',[ts]); await T('touchEnd',[ts]);
 await p.waitForTimeout(900);
 const started=await p.evaluate(()=>window.__TORI.G.state);
 ok(nm+': 진짜 터치로 게임이 시작된다', started==='play', started);

 await p.evaluate(()=>{ const G=window.__TORI;
   Object.defineProperty(window,'__swings',{get(){return G.dbg.atkN()-(window.__base||0);},
     set(v){window.__base=G.dbg.atkN()-v;},configurable:true});
   window.__swings=0; G.S.prog={}; G.S.lv=30; G.enterChapter(0); });
 await p.waitForTimeout(500);
 const R=await p.evaluate(()=>{
   const g=i=>{const e=document.getElementById(i); if(!e) return null; const q=e.getBoundingClientRect();
     return {x:q.left+q.width/2,y:q.top+q.height/2};};
   const cv=document.querySelector('canvas').getBoundingClientRect();
   return {atk:g('btnAtk'),ult:g('btnUlt'),inh:g('btnInhale'),bag:g('btnBag'),map:g('btnMap'),
           full:g('btnFull'),exit:g('btnExit'),
           stick:{x:cv.left+cv.width*0.18,y:cv.top+cv.height*0.78}};
 });

 /* 조이스틱 */
 const x0=await p.evaluate(()=>window.__TORI.P.x);
 await T('touchStart',[R.stick]);
 for(let i=0;i<10;i++){ await T('touchMove',[{x:R.stick.x+70,y:R.stick.y}]); await p.waitForTimeout(60); }
 const mv=await p.evaluate((x)=>Math.abs(window.__TORI.P.x-x)>15,x0);
 await T('touchEnd',[{x:R.stick.x+70,y:R.stick.y}]);
 await p.waitForTimeout(200);
 const stopped=await p.evaluate(()=>window.__TORI.P.vx===0&&window.__TORI.P.vy===0);
 ok(nm+': 조이스틱 이동 + 떼면 정지', mv&&stopped, `이동 ${mv} 정지 ${stopped}`);

 /* 삼키기 꾹 누르기 */
 await p.waitForTimeout(400);
 await T('touchStart',[R.inh]);
 await p.waitForTimeout(700);
 const inhOn=await p.evaluate(()=>window.__TORI.P.inhale);
 for(let i=0;i<6;i++){ await T('touchMove',[{x:R.inh.x+8,y:R.inh.y-8}]); await p.waitForTimeout(80); }
 const inhStill=await p.evaluate(()=>window.__TORI.P.inhale);
 await T('touchEnd',[{x:R.inh.x+8,y:R.inh.y-8}]);
 await p.waitForTimeout(300);
 const inhOff=await p.evaluate(()=>window.__TORI.P.inhale);
 ok(nm+': 삼키기 꾹 누르면 켜지고 흔들려도 유지', inhOn&&inhStill, `on ${inhOn} 유지 ${inhStill}`);
 ok(nm+': 삼키기 떼면 꺼진다', inhOff===false);

 /* 필살기 */
 await p.evaluate(()=>{window.__TORI.S.ult=100; window.__ultFired=0;
   const o=window.__TORI.ultFxOn; setInterval(()=>{ if(/^1/.test(o())) window.__ultFired=1; },16); });
 await T('touchStart',[R.ult]); await p.waitForTimeout(120); await T('touchEnd',[R.ult]);
 await p.waitForTimeout(400);
 const ultUsed=await p.evaluate(()=>window.__ultFired===1);
 ok(nm+': 필살기 버튼이 터치로 눌린다', ultUsed===true);

 /* 메뉴 버튼 */
 await p.waitForTimeout(700);
 await T('touchStart',[R.bag]); await T('touchEnd',[R.bag]);
 await p.waitForTimeout(600);
 const opened=await p.evaluate(()=>window.__TORI.sheetOpen);
 await p.evaluate(()=>window.__TORI.closeSheet());
 await p.waitForTimeout(500);
 ok(nm+': 가방 버튼이 터치로 열린다', opened===true);

 /* 공격 : 꾹 + 톡톡 */
 await p.waitForTimeout(400);
 await p.evaluate(()=>window.__swings=0);
 await T('touchStart',[R.atk]);
 await p.waitForTimeout(2200);
 const hold=await p.evaluate(()=>window.__swings);
 await T('touchEnd',[R.atk]);
 ok(nm+': 공격 꾹 누르기 4회 이상', hold>=4, hold+'회');
 await p.waitForTimeout(800);
 await p.evaluate(()=>window.__swings=0);
 for(let i=0;i<6;i++){ await T('touchStart',[R.atk]); await p.waitForTimeout(40);
   await T('touchEnd',[R.atk]); await p.waitForTimeout(180); }
 await p.waitForTimeout(800);
 const taps=await p.evaluate(()=>window.__swings);
 ok(nm+': 공격 톡톡 6번 → 5회 이상', taps>=5, taps+'회');

 ok(nm+': 콘솔 오류 없음', p.__errs.length===0, p.__errs.slice(0,2).join(' | '));
 await ctx.close();
}
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
