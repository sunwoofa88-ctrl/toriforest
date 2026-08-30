/* 실기와 똑같은 '진짜 터치'로 공격 버튼 검증 (CDP touch 주입) */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
/* 갤럭시 탭 A9+ 가로 */
const ctx=await b.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1.5,
  isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'});
const p=await ctx.newPage();
p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
await p.goto(F);
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
const cdp=await ctx.newCDPSession(p);
async function touch(type, pts){
  await cdp.send('Input.dispatchTouchEvent',{type, touchPoints:pts.map((q,i)=>({x:q.x,y:q.y,id:i+1}))});
}
await p.click('#tapstart');
await p.waitForTimeout(900);
await p.evaluate(()=>{ const T=window.__TORI;
  Object.defineProperty(window,'__swings',{ get(){ return T.dbg.atkN()-(window.__base||0); },
    set(v){ window.__base=T.dbg.atkN()-v; }, configurable:true });
  window.__swings=0;
  T.S.prog={}; T.S.lv=30; T.S.abil='acorn_blade'; T.enterChapter(0);
});
await p.waitForTimeout(500);
const btn=await p.evaluate(()=>{ const q=document.getElementById('btnAtk').getBoundingClientRect();
  return {x:q.left+q.width/2, y:q.top+q.height/2, w:q.width, h:q.height}; });
console.log(`     공격버튼 위치 (${Math.round(btn.x)},${Math.round(btn.y)}) 크기 ${Math.round(btn.w)}x${Math.round(btn.h)}`);

console.log('\n[A] 진짜 터치로 꾹 누르기 (3초)');
await p.evaluate(()=>window.__swings=0);
await touch('touchStart',[btn]);
await p.waitForTimeout(3000);
const holdN=await p.evaluate(()=>window.__swings);
await touch('touchEnd',[btn]);
await p.waitForTimeout(700);
const afterN=await p.evaluate(()=>window.__swings);
ok('3초 꾹 누르면 5회 이상 공격', holdN>=5, holdN+'회');
ok('떼면 멈춘다', afterN-holdN<=1, '뗀 뒤 '+(afterN-holdN)+'회');

console.log('\n[B] 누른 채로 손가락이 흔들려도 안 끊긴다 (실기에서 제일 흔한 상황)');
await p.waitForTimeout(700);
await p.evaluate(()=>window.__swings=0);
await touch('touchStart',[btn]);
await p.waitForTimeout(400);
/* 손가락을 조금씩 움직인다 → 예전엔 여기서 pointercancel 이 나며 끊겼다 */
for(let i=0;i<14;i++){
  await touch('touchMove',[{x:btn.x+(i%2?9:-9), y:btn.y+(i%3?7:-7)}]);
  await p.waitForTimeout(120);
}
const wiggleN=await p.evaluate(()=>window.__swings);
await touch('touchEnd',[{x:btn.x, y:btn.y}]);
ok('손가락을 흔들어도 계속 공격한다', wiggleN>=4, wiggleN+'회');

console.log('\n[C] 버튼 밖으로 완전히 벗어나도 뗄 때까지 유지');
await p.waitForTimeout(700);
await p.evaluate(()=>window.__swings=0);
await touch('touchStart',[btn]);
await p.waitForTimeout(300);
await touch('touchMove',[{x:btn.x-160, y:btn.y-120}]);   /* 버튼 밖 */
await p.waitForTimeout(1500);
const outN=await p.evaluate(()=>window.__swings);
await touch('touchEnd',[{x:btn.x-160, y:btn.y-120}]);
await p.waitForTimeout(600);
const outAfter=await p.evaluate(()=>window.__swings);
ok('버튼 밖으로 나가도 계속 공격', outN>=3, outN+'회');
ok('밖에서 떼면 멈춘다', outAfter-outN<=1, '뗀 뒤 '+(outAfter-outN)+'회');

console.log('\n[D] 톡톡 두드리기 — 누를 때마다 반드시 나간다');
await p.waitForTimeout(900);
await p.evaluate(()=>window.__swings=0);
for(let i=0;i<8;i++){
  await touch('touchStart',[btn]);
  await p.waitForTimeout(45);
  await touch('touchEnd',[btn]);
  await p.waitForTimeout(160);
}
await p.waitForTimeout(900);
const tapN=await p.evaluate(()=>window.__swings);
ok('8번 톡톡 → 6회 이상 공격 (버려짐 없음)', tapN>=6, tapN+'회');

console.log('\n[E] 왼손 조이스틱 + 오른손 공격 동시 (실제 플레이 자세)');
await p.waitForTimeout(700);
const both = await p.evaluate(()=>{ const cv=document.querySelector('canvas').getBoundingClientRect();
  return {sx:cv.left+cv.width*0.18, sy:cv.top+cv.height*0.78}; });
await p.evaluate(()=>window.__swings=0);
const x0=await p.evaluate(()=>window.__TORI.P.x);
await touch('touchStart',[{x:both.sx,y:both.sy}]);
await touch('touchStart',[{x:both.sx,y:both.sy},btn]);
for(let i=0;i<12;i++){
  await touch('touchMove',[{x:both.sx+70,y:both.sy},btn]);
  await p.waitForTimeout(120);
}
const bothN=await p.evaluate(()=>window.__swings);
const moved=await p.evaluate((x)=>Math.abs(window.__TORI.P.x-x)>15, x0);
await touch('touchEnd',[{x:both.sx+70,y:both.sy},btn]);
await p.waitForTimeout(500);
ok('걸으면서 동시에 공격이 된다', bothN>=3 && moved, `공격 ${bothN}회, 이동 ${moved}`);

console.log('\n[F] 세 손가락으로 마구 두드려도 자동공격이 안 남는다');
await p.waitForTimeout(700);
await touch('touchStart',[btn]);
await touch('touchStart',[btn,{x:btn.x+6,y:btn.y+6}]);
await touch('touchStart',[btn,{x:btn.x+6,y:btn.y+6},{x:btn.x-6,y:btn.y-6}]);
await p.waitForTimeout(700);
await touch('touchEnd',[]);
await p.waitForTimeout(600);
await p.evaluate(()=>window.__swings=0);
await p.waitForTimeout(1800);
const leak=await p.evaluate(()=>window.__swings);
ok('손 뗀 뒤 자동공격 누수 없음', leak===0, leak+'회');

ok('실기 터치 검증 중 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));
console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
