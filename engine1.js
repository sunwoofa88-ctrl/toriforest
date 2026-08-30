/* ============================================================================
   런타임 코어 — 캔버스 / 월드 / 카메라 / 풀
   ========================================================================== */
var cv=document.getElementById('gc'), ctx=cv.getContext('2d',{alpha:false});
var frameEl=document.getElementById('frame');
var W=360,H=640, SC=1;
var QUALITY=2;
var MAXP=[34,72,140];
var WD=null;                      /* 월드 데이터 */
var cam={x:0,y:0};

function layout(){
  var r=frameEl.getBoundingClientRect();
  var oldW=W, oldH=H;
  W=Math.max(280,Math.round(r.width)); H=Math.max(360,Math.round(r.height));
  DPR=calcDPR();
  SC = Math.max(0.80, Math.min(1.45, Math.min(W*1.06, H*0.80)/440));
  cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
  cv.style.width=W+'px'; cv.style.height=H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingQuality='low';
  P.size=Math.round(112*SC);
  var i;
  for(i=0;i<EN.length;i++){ var e=EN[i]; if(e.alive) e.size=Math.round(MON[e.key].sz*1.06*SC); }
  initAmb();
  clampCam(true);
  if(!running) render();
}

/* ---- 오브젝트 풀 ---- */
function mkPool(n,factory){ var a=new Array(n); for(var i=0;i<n;i++){ a[i]=factory(); a[i].alive=false; } a.head=0; return a; }
function take(pool){
  var n=pool.length;
  for(var i=0;i<n;i++){ var k=(pool.head+i)%n; if(!pool[k].alive){ pool.head=(k+1)%n; pool[k].alive=true; return pool[k]; } }
  var f=pool[pool.head]; pool.head=(pool.head+1)%n; f.alive=true; return f;
}
var EN=mkPool(22,function(){return{alive:false,uid:0,key:'',x:0,y:0,hp:0,hpMax:1,atk:0,spd:0,size:60,dir:-1,
  bob:0,hitT:0,freeze:0,stun:0,atkCd:0,boss:0,fly:0,hover:0,kbx:0,kby:0,sq:0,dead:0,deadT:0,pull:0,tele:0,act:0,phase:0,
  camp:-1,hx:0,hy:0,wt:0};});
var PR=mkPool(60,function(){return{alive:false,kind:'',x:0,y:0,vx:0,vy:0,gr:0,life:0,dmg:0,r:10,rot:0,spin:0,
  pierce:0,color:'#fff',abil:'sword',t:0,ret:0,hitId:0,spr:null,crit:0,hits:null,z:0,vz:0};});
var PT=mkPool(200,function(){return{alive:false,spr:null,x:0,y:0,vx:0,vy:0,gr:0,life:0,max:1,size:10,rot:0,spin:0,
  color:'#fff',add:0,fade:1,grow:0,scr:0};});
var DN=mkPool(24,function(){return{alive:false,x:0,y:0,vy:0,life:0,txt:'',size:20,color:'#fff',crit:0};});
var LT=mkPool(48,function(){return{alive:false,kind:'',amt:1,x:0,y:0,vx:0,vy:0,z:0,vz:0,t:0,ph:0,spr:null};});
var HITID=1, ENUID=1;

/* ---- 플레이어 ---- */
var P={x:200,y:200,vx:0,vy:0,facing:1,fx:1,fy:0,size:112,bob:0,squash:1,
  atkT:0,atkDir:0,hurtT:0,invT:0,inhale:0,inhaleT:0,dead:0,deadT:0,
  blink:0,blinkT:2,dashT:0,dashX:0,dashY:0,combo:0,comboT:0,moving:0,step:0};
var HP=100;

var G={ state:'play', stateT:0, shake:0, flash:0, flashCol:'#fff', slow:0, fade:0, fadeDir:0, hint:'', hintT:0 };
var pets=[];

function SLAM_R(){ return 190*SC; }
function shake(a){ if(a>G.shake) G.shake=a; }
function flash(c,a){ G.flash=Math.max(G.flash,a||0.5); G.flashCol=c||'#fff'; }

/* ---- 앰비언트 (화면 공간) ---- */
var AMB=[];
function initAmb(){
  AMB.length=0;
  for(var i=0;i<15;i++)
    AMB.push({ x:Math.random()*W, y:Math.random()*H, r:2+Math.random()*5,
      vx:-6-Math.random()*16, vy:-4+Math.random()*14, rot:Math.random()*6.28,
      spin:(Math.random()-0.5)*1.6, leaf:i%3===0?1:0, ph:Math.random()*6.28, sp:0.6+Math.random()*1.1 });
}
function updateAmb(dt){
  for(var i=0;i<AMB.length;i++){
    var a=AMB[i]; a.ph+=dt*a.sp; a.rot+=a.spin*dt;
    a.x+=(a.vx+Math.sin(a.ph)*10)*dt; a.y+=(a.vy+Math.cos(a.ph*0.7)*6)*dt;
    if(a.x<-24){a.x=W+20;a.y=Math.random()*H;}
    if(a.x>W+24){a.x=-20;a.y=Math.random()*H;}
    if(a.y<-24) a.y=H-10;
    if(a.y>H+24){a.y=-16;a.x=Math.random()*W;}
  }
}
function drawAmb(){
  if(QUALITY===0) return;
  for(var i=0;i<AMB.length;i++){
    var a=AMB[i]; ctx.save();
    if(a.leaf){
      ctx.globalAlpha=0.5; ctx.translate(a.x,a.y); ctx.rotate(a.rot);
      var l=a.r*3.4; ctx.drawImage(SPR.fx.leaf,-l/2,-l/2,l,l*0.7);
    } else {
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=0.26+Math.sin(a.ph*2)*0.14;
      var p2=a.r*5; ctx.drawImage(SPR.fx.puff,a.x-p2/2,a.y-p2/2,p2,p2);
    }
    ctx.restore();
  }
}

/* ---- 파티클 / 숫자 / 토스트 ---- */
var PTcount=0;
function pt(spr,x,y,vx,vy,life,size,color,add,gr,spin,grow,scr){
  if(PTcount>=MAXP[QUALITY]) return null;
  var p=take(PT);
  p.spr=spr;p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.gr=gr||0;p.life=life;p.max=life;
  p.size=size;p.rot=Math.random()*6.28;p.spin=spin||0;p.color=color||'#fff';
  p.add=add?1:0;p.fade=1;p.grow=grow||0;p.scr=scr?1:0;
  PTcount++; return p;
}
function burst(x,y,n,color,spd,size,add){
  n=Math.round(n*(QUALITY===0?0.45:QUALITY===1?0.72:1));
  for(var i=0;i<n;i++){
    var a=Math.random()*6.2832, v=spd*(0.4+Math.random()*0.8);
    pt(SPR.fx.puff,x,y,Math.cos(a)*v,Math.sin(a)*v-spd*0.25,0.34+Math.random()*0.3,
       size*(0.6+Math.random()*0.7),color,add?1:0,300,0,-0.5);
  }
}
function dmgNum(x,y,v,crit,color){
  var d=take(DN);
  d.x=x;d.y=y;d.vy=-108;d.life=crit?0.82:0.62;
  d.txt=(v<1?1:Math.round(v))+'';d.size=crit?30:22;d.color=color||(crit?'#FFE066':'#FFFFFF');d.crit=crit?1:0;
}
function popText(x,y,txt,color,size){
  var d=take(DN); d.x=x;d.y=y;d.vy=-72;d.life=1.0;d.txt=txt;d.size=size||18;d.color=color||'#8CF07A';d.crit=2;
}
var toastBox=document.getElementById('toasts');
function toast(msg,cls,iconCv,ms){
  var d=document.createElement('div'); d.className='toast '+(cls||'');
  if(iconCv){ var i=iconCv.cloneNode(true); i.getContext('2d').drawImage(iconCv,0,0);
    i.style.cssText='width:24px;height:24px;flex:none'; d.appendChild(i); }
  var sp=document.createElement('span'); sp.innerHTML=msg; d.appendChild(sp);
  toastBox.appendChild(d);
  while(toastBox.children.length>3) toastBox.removeChild(toastBox.firstChild);
  setTimeout(function(){ d.className+=' out'; setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); },260); }, ms||3200);
}
var bannerBox=document.getElementById('banner');
function banner(main,sub,hold){
  bannerBox.innerHTML='';
  var d=document.createElement('div'); d.className='bnr'; d.textContent=main; bannerBox.appendChild(d);
  if(sub){ var e=document.createElement('div'); e.className='bnr sub'; e.textContent=sub; bannerBox.appendChild(e); }
  setTimeout(function(){
    for(var i=0;i<bannerBox.children.length;i++) bannerBox.children[i].className+=' out';
    setTimeout(function(){ bannerBox.innerHTML=''; },320);
  }, hold||1200);
}

/* ============================================================================
   월드 생성
   ========================================================================== */
function tileAt(wx,wy){
  var tx=Math.floor(wx/TS), ty=Math.floor(wy/TS);
  if(tx<0||ty<0||tx>=COLS||ty>=ROWS) return T_ROCK;
  return WD.tiles[ty*COLS+tx];
}
function isSolidTile(t){ return t===T_ROCK||t===T_WATER; }
function solidAt(wx,wy){ return isSolidTile(tileAt(wx,wy)); }

function buildWorld(zi){
  var rnd=mulberry32(4242+zi*977), i, tx, ty;
  var tiles=new Uint8Array(COLS*ROWS);
  function set(tx,ty,v){ if(tx>=0&&ty>=0&&tx<COLS&&ty<ROWS) tiles[ty*COLS+tx]=v; }
  function get(tx,ty){ return (tx<0||ty<0||tx>=COLS||ty>=ROWS)? T_ROCK : tiles[ty*COLS+tx]; }
  function blob(cx,cy,rad,v,jit){
    for(ty=Math.floor(cy-rad-1);ty<=cy+rad+1;ty++)
      for(tx=Math.floor(cx-rad-1);tx<=cx+rad+1;tx++){
        var dx=tx-cx, dy=(ty-cy)*1.18;
        var d=Math.sqrt(dx*dx+dy*dy);
        if(d<=rad*(1+(jit?(rnd()-0.5)*0.42:0))) set(tx,ty,v);
      }
  }
  function strokePath(x0,y0,x1,y1,wid){
    var steps=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2)+1;
    for(var s=0;s<=steps;s++){
      var t=s/steps;
      var wob=Math.sin(t*Math.PI*2.4+zi)*1.5;
      var px=x0+(x1-x0)*t + wob*(Math.abs(y1-y0)>Math.abs(x1-x0)?1:0);
      var py=y0+(y1-y0)*t + wob*(Math.abs(y1-y0)>Math.abs(x1-x0)?0:1);
      for(var oy=-wid;oy<=wid;oy++) for(var ox=-wid;ox<=wid;ox++){
        if(ox*ox+oy*oy>wid*wid+0.5) continue;
        var gx=Math.round(px+ox), gy=Math.round(py+oy);
        if(get(gx,gy)===T_ROCK||get(gx,gy)===T_WATER) continue;
        set(gx,gy,T_PATH);
      }
    }
  }
  /* 1. 잔디 + 테두리 바위 */
  for(ty=0;ty<ROWS;ty++) for(tx=0;tx<COLS;tx++){
    var edge = tx<2||ty<2||tx>=COLS-2||ty>=ROWS-2;
    tiles[ty*COLS+tx] = edge? T_ROCK : T_GRASS;
  }
  for(i=0;i<26;i++){ var bx=1+rnd()*(COLS-2), by=1+rnd()*(ROWS-2);
    if(bx>3&&bx<COLS-4&&by>3&&by<ROWS-4) continue;
    blob(bx,by,1.4+rnd()*1.6,T_ROCK,1); }
  /* 2. 연못 + 모래 */
  var pondX=COLS*(0.30+rnd()*0.16), pondY=ROWS*(0.62+rnd()*0.16);
  blob(pondX,pondY,4.4,T_SAND,1);
  blob(pondX,pondY,3.1,T_WATER,1);
  blob(pondX+3.4,pondY-1.6,2.6,T_SAND,1);
  blob(pondX+3.4,pondY-1.6,1.5,T_WATER,1);
  /* 3. 바위 지대 */
  for(i=0;i<5;i++) blob(3+rnd()*(COLS-6),3+rnd()*(ROWS-6),1.6+rnd()*1.7,T_ROCK,1);
  /* 4. 수풀 */
  for(i=0;i<9;i++) blob(3+rnd()*(COLS-6),3+rnd()*(ROWS-6),1.8+rnd()*2.4,T_TALL,1);

  /* 5. 랜드마크 */
  function pos(fx,fy){ return {tx:Math.round(COLS*fx), ty:Math.round(ROWS*fy)}; }
  var LM={
    spawn: pos(0.11,0.50),
    camps: [pos(0.32,0.22), pos(0.46,0.78), pos(0.66,0.34)],
    arena: pos(0.855,0.70),
    gate:  pos(0.90,0.28)
  };
  function clearArea(t,rad,v){ blob(t.tx,t.ty,rad,v===undefined?T_GRASS:v,0); }
  clearArea(LM.spawn,2.6);
  for(i=0;i<3;i++) clearArea(LM.camps[i],2.4);
  clearArea(LM.arena,4.2);
  clearArea(LM.gate,2.0);
  /* 6. 길 */
  strokePath(LM.spawn.tx,LM.spawn.ty, LM.camps[0].tx,LM.camps[0].ty, 1);
  strokePath(LM.camps[0].tx,LM.camps[0].ty, LM.camps[2].tx,LM.camps[2].ty, 1);
  strokePath(LM.spawn.tx,LM.spawn.ty, LM.camps[1].tx,LM.camps[1].ty, 1);
  strokePath(LM.camps[1].tx,LM.camps[1].ty, LM.arena.tx,LM.arena.ty, 1);
  strokePath(LM.camps[2].tx,LM.camps[2].ty, LM.arena.tx,LM.arena.ty, 1);
  strokePath(LM.arena.tx,LM.arena.ty, LM.gate.tx,LM.gate.ty, 1);

  var WDx={ zi:zi, tiles:tiles, props:[], camps:[], chests:[], grid:null };
  function W2(t){ return {x:(t.tx+0.5)*TS, y:(t.ty+0.5)*TS}; }
  WDx.spawn=W2(LM.spawn);
  WDx.arena=W2(LM.arena);
  WDx.gatePos=W2(LM.gate);
  var mobs=ZONE[zi].mobs;
  for(i=0;i<3;i++){
    var cp=W2(LM.camps[i]);
    WDx.camps.push({x:cp.x,y:cp.y,r:150,mob:mobs[i%mobs.length],max:3,t:0,alive:0});
  }

  /* 7. 소품 배치 */
  var used=[];
  function farEnough(x,y,d){
    for(var u=0;u<used.length;u++){ var dx=used[u][0]-x, dy=used[u][1]-y;
      if(dx*dx+dy*dy < d*d) return false; }
    return true;
  }
  function place(kind,x,y,v){
    var sp=PROP_SPEC[kind];
    WDx.props.push({k:kind,v:v||0,x:x,y:y,h:sp[0]*SC_W,r:sp[1]*SC_W,solid:sp[2],id:WDx.props.length});
    used.push([x,y]);
  }
  var SC_W=1;
  /* 오두막 · 표지판 (시작 지점) */
  place('hut', WDx.spawn.x-90, WDx.spawn.y-70);
  place('sign', WDx.spawn.x+70, WDx.spawn.y+40);
  /* 캠프 : 모닥불 + 돌 */
  for(i=0;i<3;i++){
    var c=WDx.camps[i];
    place('fire', c.x, c.y);
    for(var q=0;q<4;q++){
      var qa=q*1.5708+0.5, qx=c.x+Math.cos(qa)*104, qy=c.y+Math.sin(qa)*84;
      if(!solidAtT(tiles,qx,qy)) place('rock', qx, qy, q%2);
    }
  }
  /* 보물상자 3개 */
  var chestSpots=[[0.20,0.16],[0.62,0.86],[0.80,0.14]];
  for(i=0;i<chestSpots.length;i++){
    var cx2=WW*chestSpots[i][0], cy2=WH*chestSpots[i][1];
    for(var tryn=0; tryn<40 && solidAtT(tiles,cx2,cy2); tryn++){ cx2+=TS*0.7; cy2+=TS*0.4; }
    WDx.chests.push({x:cx2,y:cy2,opened:false,idx:i});
    place('chest',cx2,cy2);
  }
  /* 문 2개 : 보스 성역 입구 · 다음 숲 */
  var ax=WDx.arena.x, ay=WDx.arena.y;
  WDx.arenaGate={x:ax-190,y:ay,open:false};
  place('gate', WDx.arenaGate.x, WDx.arenaGate.y);
  WDx.exitGate={x:WDx.gatePos.x,y:WDx.gatePos.y,open:false};
  place('gate', WDx.exitGate.x, WDx.exitGate.y);
  WDx.arenaGateProp=WDx.props.length-2;
  WDx.exitGateProp=WDx.props.length-1;

  /* 자연물 흩뿌리기 */
  var tries=0, want= 190;
  while(want>0 && tries<4000){
    tries++;
    var x=TS*2+rnd()*(WW-TS*4), y=TS*2+rnd()*(WH-TS*4);
    var t=tiles[Math.floor(y/TS)*COLS+Math.floor(x/TS)];
    if(t===T_WATER||t===T_ROCK) continue;
    var kind;
    if(t===T_PATH){ if(rnd()<0.86) continue; kind='tuft'; }
    else if(t===T_SAND){ kind = rnd()<0.5?'rock':'tuft'; }
    else if(t===T_TALL){ kind = rnd()<0.72?'tuft':'bush'; }
    else {
      var q3=rnd();
      kind = q3<0.34?'tree' : q3<0.52?'bush' : q3<0.64?'rock' : q3<0.72?'stump' : q3<0.88?'flower':'tuft';
      if(zi===3 && q3>0.88) kind='crystal';
    }
    var minD = kind==='tree'? 86 : (kind==='hut'?200: (PROP_SPEC[kind][2]?66:26));
    if(!farEnough(x,y,minD)) continue;
    /* 길 위 큰 소품 금지 */
    if(PROP_SPEC[kind][2] && t===T_PATH) continue;
    place(kind,x,y, (rnd()*2)|0);
    want--;
  }
  /* 8. 공간 분할 (컬링·충돌용) */
  var GW=Math.ceil(WW/256), GH=Math.ceil(WH/256);
  var grid=new Array(GW*GH); for(i=0;i<grid.length;i++) grid[i]=[];
  for(i=0;i<WDx.props.length;i++){
    var pr=WDx.props[i];
    var gx=Math.min(GW-1,Math.max(0,Math.floor(pr.x/256))), gy=Math.min(GH-1,Math.max(0,Math.floor(pr.y/256)));
    grid[gy*GW+gx].push(pr);
  }
  WDx.grid=grid; WDx.GW=GW; WDx.GH=GH;
  return WDx;
}
function solidAtT(tiles,wx,wy){
  var tx=Math.floor(wx/TS), ty=Math.floor(wy/TS);
  if(tx<0||ty<0||tx>=COLS||ty>=ROWS) return true;
  var t=tiles[ty*COLS+tx];
  return t===T_ROCK||t===T_WATER;
}
function propsNear(x,y,rad,out){
  out.length=0;
  var g0=Math.max(0,Math.floor((x-rad)/256)), g1=Math.min(WD.GW-1,Math.floor((x+rad)/256));
  var h0=Math.max(0,Math.floor((y-rad)/256)), h1=Math.min(WD.GH-1,Math.floor((y+rad)/256));
  for(var gy=h0;gy<=h1;gy++) for(var gx=g0;gx<=g1;gx++){
    var cell=WD.grid[gy*WD.GW+gx];
    for(var i=0;i<cell.length;i++) out.push(cell[i]);
  }
  return out;
}
