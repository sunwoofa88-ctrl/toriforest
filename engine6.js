
/* ============================================================================
   입력 — 조이스틱(모바일) / WASD·마우스(PC)
   ========================================================================== */
var STICK_R=54;
var stick={on:false,id:-1,ox:0,oy:0,kx:0,ky:0};
var sheetOpen=false, playing=false;
var keys={};
var inhalePtrs=[];

function canvasPoint(ev){ var r=cv.getBoundingClientRect(); return {x:ev.clientX-r.left, y:ev.clientY-r.top}; }
function screenToWorld(x,y){ return {x:x+cam.x, y:y+cam.y}; }

cv.addEventListener('pointerdown',function(ev){
  if(sheetOpen||!playing) return;
  ev.preventDefault(); audioInit();
  var p=canvasPoint(ev);
  if(p.x < W*0.52 && p.y > H*0.30){
    stick.on=true; stick.id=ev.pointerId;
    stick.ox=p.x; stick.oy=p.y; stick.kx=p.x; stick.ky=p.y;
    try{ cv.setPointerCapture(ev.pointerId); }catch(e){}
  } else {
    var w=screenToWorld(p.x,p.y); doAttack(w.x,w.y);
  }
},{passive:false});
cv.addEventListener('pointermove',function(ev){
  if(!stick.on||ev.pointerId!==stick.id) return;
  var p=canvasPoint(ev);
  var dx=p.x-stick.ox, dy=p.y-stick.oy, d=Math.sqrt(dx*dx+dy*dy);
  if(d>STICK_R){ dx=dx/d*STICK_R; dy=dy/d*STICK_R; d=STICK_R; }
  stick.kx=stick.ox+dx; stick.ky=stick.oy+dy;
  var dead=STICK_R*0.22;
  if(d<dead){ P.vx=0; P.vy=0; }
  else { var f=Math.min(1,(d-dead)/(STICK_R-dead)); P.vx=dx/d*f; P.vy=dy/d*f; }
},{passive:true});
function stickEnd(ev){
  if(ev && ev.pointerId!==stick.id) return;
  stick.on=false; stick.id=-1; P.vx=0; P.vy=0;
}
cv.addEventListener('pointerup',stickEnd);
cv.addEventListener('pointercancel',stickEnd);
cv.addEventListener('contextmenu',function(e){e.preventDefault();});

var btnInhale=document.getElementById('btnInhale');
function inhaleOn(e){
  if(e){ e.preventDefault();
    if(inhalePtrs.indexOf(e.pointerId)<0) inhalePtrs.push(e.pointerId);
    try{ btnInhale.setPointerCapture(e.pointerId); }catch(err){}
  }
  P.inhale=true; audioInit();
}
function inhaleOff(e){
  if(e&&e.pointerId!=null){
    var k=inhalePtrs.indexOf(e.pointerId); if(k>=0) inhalePtrs.splice(k,1);
    if(inhalePtrs.length) return;
  } else inhalePtrs.length=0;
  P.inhale=false;
}
btnInhale.addEventListener('pointerdown',inhaleOn,{passive:false});
btnInhale.addEventListener('pointerup',inhaleOff);
btnInhale.addEventListener('pointercancel',inhaleOff);
document.getElementById('btnUlt').addEventListener('click',function(){ audioInit(); doUlt(); });
(function(){
  var ab=document.getElementById('btnAtk');
  function fire(e){ if(e) e.preventDefault(); audioInit();
    var t=nearestEnemy(P.x,P.y,1e9);
    doAttack(t?t.x:P.x+P.fx*160, t?t.y:P.y+P.fy*160);
  }
  ab.addEventListener('pointerdown',fire,{passive:false});
  var rep=0;
  ab.addEventListener('pointerdown',function(){ rep=setInterval(fire,90); },{passive:true});
  function stop(){ clearInterval(rep); }
  ab.addEventListener('pointerup',stop); ab.addEventListener('pointercancel',stop); ab.addEventListener('pointerleave',stop);
})();

window.addEventListener('keydown',function(e){
  if(e.repeat) return;
  var k=e.key.toLowerCase(); keys[k]=1;
  if(!playing){ if(k===' '||k==='enter'){ e.preventDefault(); beginPlay(); } return; }
  if(sheetOpen){ if(k==='escape') closeSheet(); return; }
  var ae=document.activeElement;
  if(ae&&ae.tagName==='BUTTON'&&(k===' '||k==='enter')) return;
  if(k===' '||k==='z'||k==='enter'){
    e.preventDefault();
    var t=nearestEnemy(P.x,P.y,1e9);
    doAttack(t?t.x:P.x+P.fx*160, t?t.y:P.y+P.fy*160);
  }
  else if(k==='x'||k==='shift') inhaleOn();
  else if(k==='c') doUlt();
  else if(k>='1'&&k<='4'){ ['btnBag','btnMake','btnBook','btnMap'].forEach(function(id,i){ if((i+1)+''===k) document.getElementById(id).click(); }); }
});
window.addEventListener('keyup',function(e){
  var k=e.key.toLowerCase(); keys[k]=0;
  if(k==='x'||k==='shift') inhaleOff();
});
function releaseAllInput(){ keys={}; P.vx=0; P.vy=0; inhalePtrs.length=0; P.inhale=false; stick.on=false; stick.id=-1; }
window.addEventListener('blur',releaseAllInput);

function pollKeys(){
  if(sheetOpen||!playing||stick.on) return;
  var l=keys['arrowleft']||keys['a'], r=keys['arrowright']||keys['d'];
  var u=keys['arrowup']||keys['w'], dn=keys['arrowdown']||keys['s'];
  var vx=(r?1:0)-(l?1:0), vy=(dn?1:0)-(u?1:0);
  var m=Math.sqrt(vx*vx+vy*vy);
  if(m>0){ P.vx=vx/m; P.vy=vy/m; } else if(!stick.on){ P.vx=0; P.vy=0; }
}
setInterval(pollKeys,33);

function debounce(fn,ms){ var t; return function(){ clearTimeout(t); t=setTimeout(fn,ms); }; }
var doLayout=debounce(function(){ layout(); },200);
window.addEventListener('resize',doLayout);
window.addEventListener('orientationchange',doLayout);

/* ============================================================================
   메인 루프
   ========================================================================== */
var STEP=1/60, acc=0, last=0, rafId=0, running=false;
var perfAcc=0, perfN=0, perfCool=0, hintShown=false;

function frame(t){
  rafId=requestAnimationFrame(frame);
  if(!last){ last=t; return; }
  var dt=(t-last)/1000; last=t;
  if(dt>0.25) dt=0.25;
  if(G.slow>0){ G.slow-=dt; dt*=0.38; }
  acc+=dt;
  var steps=0;
  while(acc>=STEP&&steps<4){ update(STEP); acc-=STEP; steps++; }
  if(steps>=4) acc=0;
  render();
  if(needSync){ syncHUD(); needSync=0; }
  if(hintInhale!==hintShown){ hintShown=hintInhale; btnInhale.setAttribute('data-ready',hintInhale?'1':'0'); }
  perfAcc+=dt; perfN++;
  if(perfN>=45){
    var avg=perfAcc/perfN; perfAcc=0; perfN=0;
    if(perfCool>0) perfCool--;
    else if(avg>0.0235&&QUALITY>0){ QUALITY--; perfCool=6; }
    else if(avg>0.0265&&QUALITY===0&&RENDER_SCALE>0.5){ RENDER_SCALE=Math.max(0.5,RENDER_SCALE-0.25); DPR=calcDPR(); layout(); perfCool=14; }
    else if(avg<0.0175&&QUALITY<2){ QUALITY++; perfCool=10; }
  }
}
function startLoop(){ if(running) return; running=true; last=0; acc=0; rafId=requestAnimationFrame(frame); }
function stopLoop(){ running=false; cancelAnimationFrame(rafId); }
document.addEventListener('visibilitychange',function(){
  if(document.hidden){ releaseAllInput(); stopLoop(); saveGame(); }
  else if(!sheetOpen&&playing) startLoop();
});
