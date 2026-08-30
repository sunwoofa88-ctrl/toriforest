
/* ---------------------------------------------------------------------------
   공격
   ------------------------------------------------------------------------- */
var atkCD=0, atkBuf=null;
function doAttack(wx,wy){
  if(P.dead||G.state!=='play'||G.fade>0) return;
  var a=S.abil, A=ABIL[a], t=abilTier(a);
  if(atkCD>0){ if(atkCD<0.16) atkBuf={x:wx,y:wy}; return; }
  atkCD=A.cd[t];
  var tgt=nearestEnemy(P.x,P.y,150*SC);
  if(tgt){ wx=tgt.x; wy=tgt.y-tgt.hover*0.4; }
  var dx=wx-P.x, dy=wy-P.y, dl=Math.sqrt(dx*dx+dy*dy)||1;
  P.fx=dx/dl; P.fy=dy/dl; P.facing = dx>=0?1:-1;
  P.atkT=0.24; P.atkDir=Math.atan2(dy,dx);
  var dmg=abilDmg(a), crit=Math.random()<0.13;
  if(crit) dmg*=2.1;
  P.combo++; P.comboT=1.1;
  if(P.combo>3) dmg*=(1+Math.min(0.35,(P.combo-3)*0.035));
  SFX.swing();
  var rng=A.range[t]*SC, i, e;

  if(A.kind==='melee'){
    var cxp=P.x+P.fx*rng*0.42, cyp=P.y+P.fy*rng*0.42;
    if(tgt && dl>rng*0.60){ P.dashT=0.13; P.dashX=tgt.x-P.fx*rng*0.42; P.dashY=tgt.y-P.fy*rng*0.42; }
    var arc=A.arc[t];
    for(i=0;i<EN.length;i++){
      e=EN[i]; if(!e.alive||e.dead) continue;
      var ex=e.x-P.x, ey=e.y-P.y, ed=Math.sqrt(ex*ex+ey*ey);
      if(ed>rng+e.size*0.4) continue;
      var dot=(ex*P.fx+ey*P.fy)/(ed||1);
      if(dot < Math.cos(arc*0.72)) continue;
      hurtEnemy(e,dmg,crit,a==='hammer'?190:120,1,ex,ey);
      if(a==='hammer') e.stun=Math.max(e.stun,0.6+t*0.3);
    }
    var sl=take(PR);
    sl.kind='fx_slash';sl.x=cxp;sl.y=cyp;sl.vx=0;sl.vy=0;sl.gr=0;sl.life=0.26;sl.t=0;
    sl.r=rng*1.05;sl.rot=P.atkDir;sl.color=A.hue;sl.abil=a;sl.dmg=0;sl.z=0;
    if(a==='hammer'){
      var rg=take(PR); rg.kind='fx_ring';rg.x=cxp;rg.y=cyp;rg.life=0.34;rg.t=0;rg.r=rng*0.95;rg.color=A.hue;rg.dmg=0;rg.z=0;
      shake(9); SFX.boom();
      for(var k=0;k<8;k++) pt(SPR.fx.dust,cxp+(Math.random()-0.5)*rng,cyp+(Math.random()-0.5)*rng*0.5,
        (Math.random()-0.5)*110,-40-Math.random()*70,0.4,26,'#FFF6E0',0,240,0,0.6);
    }
  }
  else if(A.kind==='beam'){
    for(i=0;i<EN.length;i++){
      e=EN[i]; if(!e.alive||e.dead) continue;
      var bx=e.x-P.x, by=e.y-P.y, bd=Math.sqrt(bx*bx+by*by);
      if(bd>rng+e.size*0.4) continue;
      var bdot=(bx*P.fx+by*P.fy)/(bd||1);
      if(bdot < Math.cos(A.arc[t]*1.1)) continue;
      hurtEnemy(e,dmg,crit,36,0,bx,by);
      if(Math.random()<0.5) burst(e.x,e.y-e.hover-e.size*0.5,2,'#FFB03D',120,12,1);
    }
    for(var f=0;f<3;f++){
      var sp3=rng*(0.4+Math.random()*0.9), spread=(Math.random()-0.5)*A.arc[t]*1.6;
      var ca=Math.cos(spread), sa=Math.sin(spread);
      var vxf=(P.fx*ca-P.fy*sa)*sp3, vyf=(P.fx*sa+P.fy*ca)*sp3;
      pt(SPR.fx.flame,P.x+P.fx*P.size*0.3,P.y+P.fy*P.size*0.3-P.size*0.32,
         vxf,vyf,0.32,32+Math.random()*20,'#FFB03D',1,0,(Math.random()-0.5)*6,0.9);
    }
    shake(1.6);
  }
  else if(A.kind==='proj'){
    var pr=take(PR);
    pr.kind='ice';pr.spr=SPR.fx.ice;
    pr.x=P.x+P.fx*P.size*0.3;pr.y=P.y+P.fy*P.size*0.3;pr.z=P.size*0.42;
    pr.vx=P.fx*A.range[t]*1.6;pr.vy=P.fy*A.range[t]*1.6;pr.vz=0;pr.gr=0;
    pr.life=0.85;pr.dmg=dmg;pr.r=17+t*3;pr.rot=P.atkDir;pr.spin=0;pr.pierce=t>=2?2:0;
    pr.color=A.hue;pr.abil=a;pr.hitId=HITID++;pr.t=0;pr.crit=crit;pr.ret=0;
  }
  else if(A.kind==='spin'){
    var n2=(t>=1)?2:1;
    for(var q=0;q<n2;q++){
      var ang2=P.atkDir+(q?-0.28:0.09), pr2=take(PR);
      pr2.kind='leaf';pr2.spr=SPR.fx.leaf;
      pr2.x=P.x+P.fx*P.size*0.28;pr2.y=P.y+P.fy*P.size*0.28;pr2.z=P.size*0.42;
      pr2.vx=Math.cos(ang2)*A.range[t]*1.5;pr2.vy=Math.sin(ang2)*A.range[t]*1.5;pr2.vz=0;pr2.gr=0;
      pr2.life=1.15;pr2.dmg=dmg;pr2.r=19;pr2.rot=0;pr2.spin=17;
      pr2.pierce=99;pr2.color=A.hue;pr2.abil=a;pr2.hitId=HITID++;pr2.t=0;pr2.ret=1;pr2.crit=crit;
    }
  }
  else if(A.kind==='lob'){
    var pr3=take(PR);
    var aimX = tgt? tgt.x : wx, aimY = tgt? tgt.y : wy;
    var ddx=aimX-P.x, ddy=aimY-P.y, dd=Math.sqrt(ddx*ddx+ddy*ddy);
    if(dd<40){ ddx=P.fx*140; ddy=P.fy*140; dd=140; }
    var maxR=A.range[t]*SC;
    if(dd>maxR){ ddx*=maxR/dd; ddy*=maxR/dd; dd=maxR; }
    var ft=0.60;
    pr3.kind='bomb';pr3.spr=SPR.fx.bomb;
    pr3.x=P.x+P.fx*P.size*0.24;pr3.y=P.y+P.fy*P.size*0.24;pr3.z=P.size*0.55;
    pr3.vx=ddx/ft;pr3.vy=ddy/ft;pr3.vz=260;pr3.gr=1400;
    pr3.life=ft;pr3.dmg=dmg;pr3.r=20;pr3.rot=0;pr3.spin=7;
    pr3.pierce=0;pr3.color=A.hue;pr3.abil=a;pr3.hitId=HITID++;pr3.t=0;pr3.crit=crit;pr3.ret=0;
  }
}
function explode(x,y,dmg,rad,crit,chain){
  SFX.boom(); shake(11); flash('#FFD9A0',0.20);
  var rg=take(PR); rg.kind='fx_ring';rg.x=x;rg.y=y;rg.life=0.36;rg.t=0;rg.r=rad;rg.color='#FFB03D';rg.dmg=0;rg.z=0;
  burst(x,y,14,'#FFD98C',300,26,1);
  for(var i=0;i<EN.length;i++){
    var e=EN[i]; if(!e.alive||e.dead) continue;
    var dx=e.x-x, dy=e.y-y, d=Math.sqrt(dx*dx+dy*dy);
    if(d<rad+e.size*0.4) hurtEnemy(e,dmg*(1-0.35*d/rad),crit,150,1,dx,dy);
  }
  if(chain) setTimeout(function(){ if(G.state==='play') explode(x+(Math.random()-0.5)*70,y+(Math.random()-0.5)*50,dmg*0.6,rad*0.8,0,0); },220);
}

/* 흡입 */
var inhaleCd=0;
function updateInhale(dt){
  if(inhaleCd>0) inhaleCd-=dt;
  if(!P.inhale||P.dead||G.state!=='play'){ P.inhaleT=Math.max(0,P.inhaleT-dt*3); return; }
  P.inhaleT=Math.min(1,P.inhaleT+dt*5);
  var rng=(170+S.lv*2.2)*SC, cone=0.62;
  if(Math.random()<0.55){
    var d0=rng*(0.35+Math.random()*0.7), sp4=(Math.random()-0.5)*cone;
    var ca=Math.cos(sp4), sa=Math.sin(sp4);
    var dxp=(P.fx*ca-P.fy*sa), dyp=(P.fx*sa+P.fy*ca);
    pt(SPR.fx.puff,P.x+dxp*d0,P.y+dyp*d0-P.size*0.35,-dxp*360,-dyp*360,0.20,16,'#FFFFFF',1,0,0,-0.6);
  }
  if(Math.floor(P.inhaleT*10)%4===0) SFX.suck();
  for(var i=0;i<EN.length;i++){
    var e=EN[i]; if(!e.alive||e.dead) continue;
    var dx=e.x-P.x, dy=e.y-P.y, d=Math.sqrt(dx*dx+dy*dy);
    if(d>rng||d<1) continue;
    var dot=(dx*P.fx+dy*P.fy)/d;
    if(dot<Math.cos(cone*1.15)) continue;
    var tough=e.boss||MON[e.key].tough;
    var pull=(e.boss?40:(tough?120:250))*(1-d/rng*0.35);
    e.x-=(dx/d)*pull*dt; e.y-=(dy/d)*pull*dt; e.pull=0.2;
    if(e.fly) e.hover += (0-e.hover)*dt*2.2;
    var canEat=!e.boss && (!tough || e.hp<=e.hpMax*0.55);
    if(canEat && d<P.size*0.72 && inhaleCd<=0) absorb(e);
  }
}
function absorb(e){
  var m=MON[e.key];
  inhaleCd=0.55;
  e.dead=1; e.deadT=0.16;
  if(e.camp>=0 && WD.camps[e.camp]) WD.camps[e.camp].alive--;
  SFX.gulp(); shake(5);
  burst(P.x,P.y-P.size*0.5,10,'#FFF3C4',180,16,1);
  S.codex[e.key]=(S.codex[e.key]|0)+1;
  gainXp(m.xp*0.7*(1+S.zone*0.55));
  dropLoot(e.x,e.y,'acorn',Math.round((5+m.xp)*(1+S.zone*0.5)));
  dropLoot(e.x,e.y,m.drop[(Math.random()*m.drop.length)|0],2);
  HP=Math.min(maxHp(),HP+Math.round(maxHp()*0.05));
  var pg=prog(); pg.kills++; if(pg.kills===killNeed()) onQuotaMet();
  S.tut2=1;
  if(m.abil){
    var first=!S.owned[m.abil];
    S.owned[m.abil]=1;
    S.cards[m.abil]=(S.cards[m.abil]|0)+1;
    var swap = first || abilDmg(m.abil)>=abilDmg(S.abil);
    if(swap && S.abil!==m.abil){ S.abil=m.abil; popText(P.x,P.y-P.size*1.15,abilName(m.abil)+'!','#FFD34E',20); }
    if(first){ banner('새 능력!',abilName(m.abil),1400); flash('#FFF3C4',0.45); SFX.levelup(); }
    else popText(P.x,P.y-P.size*1.35,'카드 +1','#8FE3FF',18);
  } else popText(P.x,P.y-P.size*1.15,'냠냠!','#FF9FC4',18);
  needSync=1;
}
function doUlt(){
  if(S.ult<100||P.dead||G.state!=='play') return;
  S.ult=0; needSync=1;
  var a=S.abil, A=ABIL[a];
  SFX.ult(); shake(18); flash(A.hue,0.6); G.slow=0.55;
  banner('필살기!',abilName(a),900);
  var dmg=abilDmg(a)*7;
  for(var i=0;i<EN.length;i++){
    var e=EN[i]; if(!e.alive||e.dead) continue;
    var d=Math.sqrt((e.x-P.x)*(e.x-P.x)+(e.y-P.y)*(e.y-P.y));
    if(d>W*0.85) continue;
    hurtEnemy(e,dmg,1,280,1,e.x-P.x,e.y-P.y);
  }
  for(var k=0;k<3;k++){
    (function(kk){ setTimeout(function(){
      if(!SPR.fx.ring) return;
      var rg=take(PR); rg.kind='fx_ring';rg.x=P.x;rg.y=P.y;rg.life=0.5;rg.t=0;
      rg.r=W*(0.34+kk*0.20);rg.color=A.hue;rg.dmg=0;rg.z=0;
    }, kk*110); })(k);
  }
  for(var q=0;q<28;q++){ var an=Math.random()*6.2832;
    pt(SPR.fx.spark,P.x,P.y-P.size*0.5,Math.cos(an)*420,Math.sin(an)*420,0.75,34,A.hue,1,0,7,-0.3); }
}
