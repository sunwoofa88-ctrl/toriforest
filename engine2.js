
/* ============================================================================
   진행 상태 · 지역 입장
   ========================================================================== */
function prog(){
  if(!S.prog) S.prog={};
  var k=''+S.zone;
  if(!S.prog[k]) S.prog[k]={kills:0,boss:0,chests:{}};
  return S.prog[k];
}
function killNeed(){ return 16+S.zone*5; }
function zoneUnlocked(z){ return z===0 || (S.prog && S.prog[''+(z-1)] && S.prog[''+(z-1)].boss); }
function clearEntities(){
  var i;
  for(i=0;i<EN.length;i++) EN[i].alive=false;
  for(i=0;i<PR.length;i++) PR[i].alive=false;
  for(i=0;i<PT.length;i++) PT[i].alive=false;
  for(i=0;i<LT.length;i++) LT[i].alive=false;
  PTcount=0;
}
function applyProgress(){
  var pg=prog();
  var ag=WD.props[WD.arenaGateProp], eg=WD.props[WD.exitGateProp];
  var open1 = pg.kills>=killNeed();
  ag.k = open1?'gateOpen':'gate'; ag.solid = open1?0:1; ag.r = open1?0:96;
  WD.arenaGate.open=open1;
  var open2 = !!pg.boss;
  eg.k = open2?'gateOpen':'gate'; eg.solid = open2?0:1; eg.r = open2?0:96;
  WD.exitGate.open=open2;
  for(var i=0;i<WD.chests.length;i++){
    if(pg.chests && pg.chests[i]){
      WD.chests[i].opened=true;
      for(var j=0;j<WD.props.length;j++) if(WD.props[j].k==='chest' && Math.abs(WD.props[j].x-WD.chests[i].x)<2){ WD.props[j].k='chestOpen'; break; }
    }
  }
}
function enterZone(zi){
  S.zone=zi;
  WD=buildWorld(zi);
  bakeProps(zi);
  WD.ground=paintGround(WD);
  WD.mini=paintMinimap(WD);
  applyProgress();
  clearEntities();
  P.x=WD.spawn.x; P.y=WD.spawn.y; P.vx=0; P.vy=0; P.dead=0;
  HP=maxHp();
  for(var i=0;i<pets.length;i++){ pets[i].x=P.x-40; pets[i].y=P.y+20; }
  for(var c=0;c<WD.camps.length;c++){ WD.camps[c].t=0; WD.camps[c].alive=0; }
  clampCam(true);
  needSync=1; saveGame();
}
function clampCam(snap){
  var tx=P.x-W/2, ty=P.y-H*0.54;
  tx = WW<=W ? (WW-W)/2 : Math.max(0,Math.min(WW-W,tx));
  ty = WH<=H ? (WH-H)/2 : Math.max(0,Math.min(WH-H,ty));
  if(snap){ cam.x=tx; cam.y=ty; } else { cam.x+=(tx-cam.x)*0.16; cam.y+=(ty-cam.y)*0.16; }
}

/* ============================================================================
   충돌
   ========================================================================== */
var _near=[];
function blocked(x,y,rad){
  if(x<TS*1.2||y<TS*1.2||x>WW-TS*1.2||y>WH-TS*1.2) return true;
  if(solidAt(x-rad,y)||solidAt(x+rad,y)||solidAt(x,y-rad*0.7)||solidAt(x,y+rad*0.5)) return true;
  propsNear(x,y,rad+70,_near);
  for(var i=0;i<_near.length;i++){
    var p=_near[i]; if(!p.solid) continue;
    var dx=x-p.x, dy=(y-p.y)*1.5;
    var rr=p.r+rad;
    if(dx*dx+dy*dy < rr*rr) return true;
  }
  return false;
}
function moveEnt(o,dx,dy,rad){
  if(dx){ if(!blocked(o.x+dx,o.y,rad)) o.x+=dx;
          else if(!blocked(o.x+dx,o.y-6,rad)) { o.x+=dx; o.y-=6; }
          else if(!blocked(o.x+dx,o.y+6,rad)) { o.x+=dx; o.y+=6; } }
  if(dy){ if(!blocked(o.x,o.y+dy,rad)) o.y+=dy;
          else if(!blocked(o.x-6,o.y+dy,rad)) { o.y+=dy; o.x-=6; }
          else if(!blocked(o.x+6,o.y+dy,rad)) { o.y+=dy; o.x+=6; } }
}

/* ============================================================================
   전투
   ========================================================================== */
function enemyStat(key,extra){
  var m=MON[key], mul=ZONE[S.zone].mul*(1+prog().kills*0.012)*(extra||1);
  return { hp:Math.round(m.hp*mul), atk:Math.round(m.atk*mul*0.55), spd:m.spd };
}
function spawnEnemyAt(key,x,y,camp,ex){
  var m=MON[key], st=enemyStat(key,ex), e=take(EN);
  e.key=key; e.hpMax=st.hp; e.hp=st.hp; e.atk=st.atk; e.spd=st.spd;
  e.size=Math.round(m.sz*1.06*SC);
  e.boss=m.boss?1:0; e.fly=m.fly?1:0;
  e.hover = e.fly? 34 : 0;
  e.x=x; e.y=y; e.hx=x; e.hy=y; e.dir=-1;
  e.bob=Math.random()*6.28; e.hitT=0; e.freeze=0; e.stun=0; e.atkCd=0.7;
  e.kbx=0; e.kby=0; e.sq=1; e.dead=0; e.deadT=0; e.pull=0; e.tele=0;
  e.act=m.boss?3.2:0; e.phase=0; e.camp=(camp==null?-1:camp); e.wt=0;
  e.uid=++ENUID;
  return e;
}
function enemyCount(){ var n=0; for(var i=0;i<EN.length;i++) if(EN[i].alive&&!EN[i].dead) n++; return n; }
function nearestEnemy(x,y,maxD){
  var best=null,bd=(maxD||1e9);
  for(var i=0;i<EN.length;i++){
    var e=EN[i]; if(!e.alive||e.dead) continue;
    var dx=e.x-x, dy=e.y-y, d=Math.sqrt(dx*dx+dy*dy);
    if(d<bd){ bd=d; best=e; }
  }
  return best;
}
function hurtEnemy(e,dmg,crit,kb,fx,kdx,kdy){
  if(!e.alive||e.dead) return;
  e.hp-=dmg; e.hitT=0.14; e.sq=1.30;
  if(kb){ var l=Math.sqrt(kdx*kdx+kdy*kdy)||1; e.kbx+=(kdx/l)*kb*(e.boss?0.2:1); e.kby+=(kdy/l)*kb*0.6*(e.boss?0.2:1); }
  dmgNum(e.x+(Math.random()-0.5)*14, e.y-e.hover-e.size*0.92, dmg, crit, crit?'#FFE066':'#FFFFFF');
  addUlt(dmg*0.35);
  if(crit) SFX.crit(); else SFX.hit();
  if(fx!==0){
    burst(e.x, e.y-e.hover-e.size*0.45, crit?7:4, crit?'#FFE7A0':'#FFFFFF', 190, crit?15:11, 1);
    shake(crit?5:2.4);
  }
  if(e.hp<=0) killEnemy(e);
}
function killEnemy(e){
  if(e.dead) return;
  e.dead=1; e.deadT=0.34; e.hp=0;
  SFX.die();
  burst(e.x,e.y-e.hover-e.size*0.45,e.boss?26:11,'#FFF3C4',e.boss?300:210,e.boss?24:15,1);
  shake(e.boss?14:4);
  if(e.boss) flash('#FFFFFF',0.45);
  if(e.camp>=0 && WD.camps[e.camp]) WD.camps[e.camp].alive--;
  var m=MON[e.key], pg=prog();
  S.codex[e.key]=(S.codex[e.key]|0)+1;
  gainXp(m.xp*(1+S.zone*0.55));
  var coins=Math.round((4+m.xp*0.9)*(1+S.zone*0.5));
  dropLoot(e.x,e.y-e.hover-e.size*0.3,'acorn',coins);
  var dn=e.boss?5:(Math.random()<0.62?1:0);
  for(var i=0;i<dn;i++) dropLoot(e.x+(Math.random()-0.5)*30,e.y-e.size*0.3,m.drop[(Math.random()*m.drop.length)|0],1);
  if(e.boss||Math.random()<0.14) dropLoot(e.x,e.y-e.size*0.4,'star',e.boss?8:1);
  if(e.boss){ onBossDefeated(); }
  else { pg.kills++; if(pg.kills===killNeed()) onQuotaMet(); }
  needSync=1;
}
function onQuotaMet(){
  applyProgress();
  SFX.clear(); flash('#FFF3C4',0.4);
  banner('길이 열렸다!','보스가 있는 성역으로!',1900);
  toast('지도에서 <b>보스 성역</b> 위치를 확인해 보세요','rare',null,5000);
  saveGame();
}
function onBossDefeated(){
  var pg=prog(); pg.boss=1;
  applyProgress();
  SFX.clear(); flash('#FFF3C4',0.55);
  banner('보스 격파!', (S.zone<ZONE.length-1? '다음 숲의 문이 열렸어요!' : '모든 숲을 정복했어요!'), 2400);
  S.acorn += 200+S.zone*180; S.star += 10+S.zone*5;
  unlockPet(S.zone);
  saveGame(); needSync=1;
}
function dropLoot(x,y,kind,amt){
  var l=take(LT);
  l.kind=kind;l.amt=amt||1;l.x=x;l.y=y;l.t=0;l.ph=0;
  l.vx=(Math.random()-0.5)*120;l.vy=(Math.random()-0.5)*80;l.z=20;l.vz=210+Math.random()*90;
  l.spr = kind==='acorn'?SPR.fx.acorn : kind==='star'?SPR.fx.star : SPR.mat[kind];
  return l;
}
function collectLoot(l){
  if(l.kind==='acorn') S.acorn+=l.amt;
  else if(l.kind==='star') S.star+=l.amt;
  else S.mat[l.kind]=(S.mat[l.kind]|0)+l.amt;
  SFX.coin(); needSync=1;
}
function gainXp(v){
  S.xp+=Math.round(v);
  var lv=0;
  while(S.xp>=xpNeed(S.lv)){ S.xp-=xpNeed(S.lv); S.lv++; lv++; }
  if(lv){
    HP=maxHp(); SFX.levelup(); flash('#FFF3C4',0.4);
    banner('레벨 업!','Lv.'+S.lv+' · 더 세졌어요!',1300);
    for(var i=0;i<22;i++){ var a=Math.random()*6.2832;
      pt(SPR.fx.spark,P.x,P.y-P.size*0.5,Math.cos(a)*230,Math.sin(a)*230-60,0.8,26,
         ['#FFD34E','#FF6FA5','#8CF07A','#8FE3FF'][(Math.random()*4)|0],1,300,6,-0.4); }
  }
  needSync=1;
}
function addUlt(v){ if(S.ult>=100) return; S.ult=Math.min(100,S.ult+v*0.16); needSync=1; }
function hurtPlayer(dmg){
  if(P.invT>0||P.dead) return;
  HP-=dmg; P.hurtT=0.45; P.invT=0.95;
  SFX.hurt(); shake(7); flash('#FF5E5E',0.26);
  dmgNum(P.x,P.y-P.size*0.9,dmg,0,'#FF9C9C');
  needSync=1;
  if(HP<=0){ HP=0; P.dead=1; P.deadT=1.5; SFX.no(); banner('앗!','괜찮아, 다시 해보자!',1400); }
}
