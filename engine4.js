
/* ============================================================================
   업데이트
   ========================================================================== */
var needSync=1;
var PLAYER_R=20;

function updatePlayer(dt){
  P.bob+=dt*4.6;
  if(atkCD>0){ atkCD-=dt; if(atkCD<=0&&atkBuf){ var q=atkBuf; atkBuf=null; doAttack(q.x,q.y); } }
  if(P.atkT>0) P.atkT-=dt;
  if(P.hurtT>0) P.hurtT-=dt;
  if(P.invT>0) P.invT-=dt;
  if(P.comboT>0){ P.comboT-=dt; if(P.comboT<=0) P.combo=0; }
  P.blinkT-=dt;
  if(P.blinkT<=0){ P.blink=0.13; P.blinkT=1.8+Math.random()*3.2; }
  if(P.blink>0) P.blink-=dt;
  if(P.dead){
    P.deadT-=dt;
    if(P.deadT<=0){
      P.dead=0; HP=maxHp(); P.invT=1.6;
      P.x=WD.spawn.x; P.y=WD.spawn.y; clampCam(true);
      toast('마을에서 다시 시작했어요!','good',null,2600);
      needSync=1;
    }
    return;
  }
  if(P.dashT>0){
    P.dashT-=dt;
    P.x+=(P.dashX-P.x)*Math.min(1,dt*22);
    P.y+=(P.dashY-P.y)*Math.min(1,dt*22);
    if(Math.random()<0.6) pt(SPR.fx.puff,P.x,P.y-P.size*0.4,0,0,0.18,P.size*0.5,'#FFFFFF',1,0,0,-0.7);
  } else {
    var sp=205*SC;
    var mvx=P.vx*sp, mvy=P.vy*sp*0.82;
    if(mvx||mvy) moveEnt(P,mvx*dt,mvy*dt,PLAYER_R*SC);
    P.moving = (mvx||mvy)?1:0;
    if(P.moving){
      P.step+=dt*9;
      var l=Math.sqrt(P.vx*P.vx+P.vy*P.vy)||1;
      P.fx=P.vx/l; P.fy=P.vy/l; P.facing=P.vx>=0?1:(P.vx<0?-1:P.facing);
      if(Math.abs(P.vx)<0.05) P.facing=P.facing;
      if(Math.random()<0.12) pt(SPR.fx.dust,P.x+(Math.random()-0.5)*14,P.y+4,(Math.random()-0.5)*30,-14,0.3,16*SC,'#FFF6E0',0,0,0,0.5);
    } else {
      P.step=0;
      var t2=nearestEnemy(P.x,P.y,260*SC);
      if(t2 && P.atkT<=0 && !P.inhale){
        var dx=t2.x-P.x, dy=t2.y-P.y, dl=Math.sqrt(dx*dx+dy*dy)||1;
        P.fx=dx/dl; P.fy=dy/dl; P.facing=dx>=0?1:-1;
      }
    }
  }
  P.squash+=(1-P.squash)*Math.min(1,dt*14);
  P.x=Math.max(TS,Math.min(WW-TS,P.x));
  P.y=Math.max(TS,Math.min(WH-TS,P.y));
}

function updateEnemies(dt){
  for(var i=0;i<EN.length;i++){
    var e=EN[i]; if(!e.alive) continue;
    if(e.dead){ e.deadT-=dt; e.sq+=(0-e.sq)*Math.min(1,dt*9); if(e.deadT<=0) e.alive=false; continue; }
    if(e.hitT>0) e.hitT-=dt;
    if(e.freeze>0) e.freeze-=dt;
    if(e.stun>0) e.stun-=dt;
    if(e.pull>0) e.pull-=dt;
    e.sq+=(1-e.sq)*Math.min(1,dt*11);
    e.bob+=dt*(e.fly?5.2:3.4);
    if(e.fly) e.hover += (34*SC-e.hover)*Math.min(1,dt*1.6);
    if(e.kbx||e.kby){
      moveEnt(e,e.kbx*dt,e.kby*dt,e.size*0.28);
      e.kbx*=(1-Math.min(1,dt*7)); e.kby*=(1-Math.min(1,dt*7));
      if(Math.abs(e.kbx)<4) e.kbx=0; if(Math.abs(e.kby)<4) e.kby=0;
    }
    var dx=P.x-e.x, dy=P.y-e.y, d=Math.sqrt(dx*dx+dy*dy)||1;
    var contact=P.size*0.34+e.size*0.34;
    var aggro=(e.boss?1400:340)*SC;

    if(e.stun<=0 && !P.dead){
      var spd=e.spd*SC*(e.freeze>0?0.34:1)*(e.boss?0.85:1);
      if(d<aggro){
        if(d>contact*0.92){
          var mx=(dx/d)*spd*dt, my=(dy/d)*spd*dt*0.85;
          if(e.fly){ e.x+=mx; e.y+=my; e.x=Math.max(TS,Math.min(WW-TS,e.x)); e.y=Math.max(TS,Math.min(WH-TS,e.y)); }
          else moveEnt(e,mx,my,e.size*0.28);
        }
        e.dir=dx>0?1:-1;
      } else {
        e.wt-=dt;
        if(e.wt<=0){ e.wt=1.2+Math.random()*1.8;
          var wa=Math.random()*6.2832, wr=(WD.camps[e.camp]?WD.camps[e.camp].r:110);
          e.hx=(WD.camps[e.camp]?WD.camps[e.camp].x:e.x)+Math.cos(wa)*wr*Math.random();
          e.hy=(WD.camps[e.camp]?WD.camps[e.camp].y:e.y)+Math.sin(wa)*wr*Math.random(); }
        var hx=e.hx-e.x, hy=e.hy-e.y, hd=Math.sqrt(hx*hx+hy*hy);
        if(hd>8){
          var wx2=(hx/hd)*spd*0.42*dt, wy2=(hy/hd)*spd*0.42*dt*0.85;
          if(e.fly){ e.x+=wx2; e.y+=wy2; } else moveEnt(e,wx2,wy2,e.size*0.28);
          e.dir=hx>0?1:-1;
        }
      }
    }
    if(e.boss){
      e.act-=dt;
      if(e.tele>0){
        e.tele-=dt;
        if(e.tele<=0){
          if(e.phase%2===0){
            var rg=take(PR); rg.kind='fx_ring';rg.x=e.x;rg.y=e.y;rg.life=0.42;rg.t=0;rg.r=SLAM_R();rg.color='#FFD34E';rg.dmg=0;rg.z=0;
            SFX.boom(); shake(15);
            for(var d2=0;d2<10;d2++) pt(SPR.fx.dust,e.x+(Math.random()-0.5)*SLAM_R(),e.y+(Math.random()-0.5)*SLAM_R()*0.5,
              (Math.random()-0.5)*220,-60-Math.random()*90,0.5,30,'#FFF6E0',0,260,0,0.7);
            var pd=Math.sqrt((P.x-e.x)*(P.x-e.x)+(P.y-e.y)*(P.y-e.y));
            if(pd<SLAM_R()) hurtPlayer(Math.round(e.atk*1.25));
          } else {
            var mobs=ZONE[S.zone].mobs, room=Math.max(0,6-enemyCount());
            for(var m2=0;m2<Math.min(2,room);m2++){
              var sa=Math.random()*6.2832;
              spawnEnemyAt(mobs[(Math.random()*mobs.length)|0], e.x+Math.cos(sa)*150, e.y+Math.sin(sa)*110, -1, 0.55);
            }
            if(room>0) popText(e.x,e.y-e.size*1.0,'친구 불러!','#FF9FC4',18);
          }
          e.phase++; e.act=3.4;
        }
      } else if(e.act<=0) e.tele=0.72;
    }
    if(d<contact && !P.dead){
      e.atkCd-=dt;
      if(e.atkCd<=0){
        e.atkCd=e.boss?1.5:1.25;
        hurtPlayer(e.atk);
        e.kbx=-(dx/d)*(e.boss?40:160); e.kby=-(dy/d)*(e.boss?30:110);
        e.sq=1.3;
      }
    } else e.atkCd=Math.max(0,e.atkCd-dt);
  }
}

/* 캠프 리스폰 */
function updateCamps(dt){
  if(G.state!=='play') return;
  var pg=prog();
  for(var i=0;i<WD.camps.length;i++){
    var c=WD.camps[i];
    var dx=c.x-P.x, dy=c.y-P.y;
    if(dx*dx+dy*dy > 1000*1000) continue;
    if(c.alive>=c.max) continue;
    c.t-=dt;
    if(c.t<=0){
      c.t=1.6+Math.random()*1.4;
      if(enemyCount()>=9) continue;
      var a=Math.random()*6.2832, r=60+Math.random()*(c.r-40);
      var sx=c.x+Math.cos(a)*r, sy=c.y+Math.sin(a)*r;
      if(solidAt(sx,sy)) continue;
      var pdx=sx-P.x, pdy=sy-P.y;
      if(pdx*pdx+pdy*pdy < 150*150) continue;
      spawnEnemyAt(c.mob,sx,sy,i,1);
      c.alive++;
    }
  }
  /* 보스 소환 */
  if(WD.arenaGate.open && !pg.boss){
    var bd=Math.sqrt((P.x-WD.arena.x)*(P.x-WD.arena.x)+(P.y-WD.arena.y)*(P.y-WD.arena.y));
    var hasBoss=false;
    for(var b=0;b<EN.length;b++) if(EN[b].alive&&!EN[b].dead&&EN[b].boss) hasBoss=true;
    if(bd<220 && !hasBoss){
      var bk=ZONE[S.zone].boss;
      spawnEnemyAt(bk, WD.arena.x+140, WD.arena.y-60, -1, 1);
      banner('보스 등장!',MON[bk].n,1600); SFX.clear(); flash('#FF6FA5',0.35);
    }
  }
}

/* 상자 · 문 */
function updateInteract(dt){
  var pg=prog(), i;
  for(i=0;i<WD.chests.length;i++){
    var c=WD.chests[i]; if(c.opened) continue;
    var dx=c.x-P.x, dy=c.y-P.y;
    if(dx*dx+dy*dy < 74*74){
      c.opened=true;
      if(!pg.chests) pg.chests={};
      pg.chests[i]=1;
      for(var j=0;j<WD.props.length;j++) if(WD.props[j].k==='chest'&&Math.abs(WD.props[j].x-c.x)<2){ WD.props[j].k='chestOpen'; WD.props[j].solid=0; break; }
      SFX.levelup(); flash('#FFF3C4',0.35); shake(6);
      var pool=[['leaf',3],['pebble',3],['jelly',3],['pollen',3],['honey',2],['glow',2],['frost',2],['ember',2],['rainbow',1],['crystal',1]];
      var pick=pool[Math.min(pool.length-1,(Math.random()*(4+S.zone*2))|0)];
      for(var q=0;q<pick[1];q++) dropLoot(c.x,c.y,pick[0],1);
      dropLoot(c.x,c.y,'star',2+S.zone);
      dropLoot(c.x,c.y,'acorn',80+S.zone*70);
      banner('보물상자!',MAT[pick[0]].n+' ×'+pick[1],1600);
      saveGame(); needSync=1;
    }
  }
  if(WD.exitGate.open && G.fadeDir===0){
    var gx=WD.exitGate.x-P.x, gy=WD.exitGate.y-P.y;
    if(gx*gx+gy*gy < 70*70){
      if(S.zone<ZONE.length-1){ G.fadeDir=1; G.fade=0.001; G.nextZone=S.zone+1; }
      else { toast('여기가 마지막 숲이에요! 마음껏 모험하세요 🎉','rare',null,4000); WD.exitGate.open=false; }
    }
  }
}

function updateProjectiles(dt){
  for(var i=0;i<PR.length;i++){
    var p=PR[i]; if(!p.alive) continue;
    p.t+=dt; p.life-=dt;
    if(p.kind==='fx_slash'||p.kind==='fx_ring'){ if(p.life<=0) p.alive=false; continue; }
    if(p.ret){
      var ph=p.t/1.15;
      if(ph>0.42){
        var hx=P.x-p.x, hy=P.y-p.y, hd=Math.sqrt(hx*hx+hy*hy)||1;
        p.vx+=(hx/hd*520-p.vx)*Math.min(1,dt*4.2);
        p.vy+=(hy/hd*520-p.vy)*Math.min(1,dt*4.2);
        if(hd<40){ p.alive=false; continue; }
      }
    }
    p.vz-=p.gr*dt; p.z+=p.vz*dt;
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.spin*dt;
    if(p.kind==='bomb' && (p.life<=0||p.z<=0)){
      p.alive=false; explode(p.x,p.y,p.dmg,(90+abilTier(p.abil)*26)*SC,p.crit,abilTier(p.abil)>=1); continue;
    }
    if(p.x<-60||p.x>WW+60||p.y<-60||p.y>WH+60||p.life<=0){ p.alive=false; continue; }
    if(p.kind!=='bomb' && p.kind!=='pet' && solidAt(p.x,p.y)){ p.alive=false; burst(p.x,p.y,4,p.color,120,12,1); continue; }
    if(p.kind==='ice'&&Math.random()<0.5) pt(SPR.fx.puff,p.x,p.y-p.z,0,0,0.2,16,'#BFF0FF',1,0,0,-0.5);
    if(p.kind==='leaf'&&Math.random()<0.35) pt(SPR.fx.puff,p.x,p.y-p.z,0,0,0.2,14,'#CFFFB0',1,0,0,-0.5);
    for(var j=0;j<EN.length;j++){
      var e=EN[j]; if(!e.alive||e.dead) continue;
      var dx=e.x-p.x, dy=e.y-p.y;
      var rr=p.r+e.size*0.38;
      if(dx*dx+dy*dy>rr*rr) continue;
      if(!p.hits) p.hits={};
      if(p.hits[e.uid]===p.hitId) continue;
      p.hits[e.uid]=p.hitId;
      hurtEnemy(e,p.dmg,p.crit,110,1,p.vx,p.vy);
      if(p.kind==='ice'){ e.freeze=Math.max(e.freeze,1.2+abilTier('ice')*0.6); burst(e.x,e.y-e.hover-e.size*0.5,5,'#BFF0FF',150,14,1); }
      if(p.pierce>0) p.pierce--;
      else { p.alive=false; burst(p.x,p.y-p.z,4,p.color,140,13,1); break; }
    }
  }
}
function updateParticles(dt){
  PTcount=0;
  for(var i=0;i<PT.length;i++){
    var p=PT[i]; if(!p.alive) continue;
    p.life-=dt;
    if(p.life<=0){ p.alive=false; continue; }
    PTcount++;
    p.vy+=p.gr*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.spin*dt;
    if(p.grow) p.size*=(1+p.grow*dt);
    p.fade=p.life/p.max;
  }
}
function updateLoot(dt){
  for(var i=0;i<LT.length;i++){
    var l=LT[i]; if(!l.alive) continue;
    l.t+=dt;
    if(l.ph===0){
      l.vz-=1500*dt; l.z+=l.vz*dt;
      l.x+=l.vx*dt; l.y+=l.vy*dt; l.vx*=0.94; l.vy*=0.94;
      if(l.z<=0){ l.z=0; l.vz*=-0.4; if(Math.abs(l.vz)<40) l.vz=0; }
      if(l.t>0.45) l.ph=1;
    } else {
      var dx=P.x-l.x, dy=(P.y-P.size*0.35)-l.y, d=Math.sqrt(dx*dx+dy*dy)||1;
      var k=Math.min(1,(l.t-0.45)*2.4);
      var sp=200+k*700;
      l.x+=(dx/d)*sp*dt; l.y+=(dy/d)*sp*dt;
      l.z+=(P.size*0.4-l.z)*Math.min(1,dt*8);
      if(d<26){ collectLoot(l); l.alive=false; }
      else if(l.t>4.5){ collectLoot(l); l.alive=false; }
    }
  }
}
function updateDN(dt){
  for(var i=0;i<DN.length;i++){
    var d=DN[i]; if(!d.alive) continue;
    d.life-=dt; if(d.life<=0){ d.alive=false; continue; }
    d.y+=d.vy*dt; d.vy+=220*dt;
  }
}
function updatePets(dt){
  for(var i=0;i<pets.length;i++){
    var q=pets[i];
    q.bob+=dt*3.4;
    var ang=Math.PI*0.75+i*0.9;
    var tx=P.x-P.fx*(64+i*30)+Math.cos(ang)*22, ty=P.y-P.fy*(50+i*22)+Math.sin(ang)*16;
    q.x+=(tx-q.x)*Math.min(1,dt*4.6); q.y+=(ty-q.y)*Math.min(1,dt*4.6);
    q.cd-=dt;
    if(q.cd<=0 && G.state==='play'){
      var e=nearestEnemy(q.x,q.y,420*SC);
      if(e){
        q.cd=1.7;
        var pr=take(PR);
        pr.kind='pet'; pr.spr=SPR.fx.spark;
        pr.x=q.x; pr.y=q.y; pr.z=30;
        var dx=e.x-q.x, dy=e.y-q.y, d=Math.sqrt(dx*dx+dy*dy)||1;
        pr.vx=dx/d*430; pr.vy=dy/d*430; pr.vz=0; pr.gr=0; pr.life=1.1;
        pr.dmg=Math.round(baseAtk()*0.55*q.lv); pr.r=15; pr.rot=0; pr.spin=9;
        pr.pierce=0; pr.color='#FFD34E'; pr.abil=S.abil; pr.hitId=HITID++; pr.t=0; pr.ret=0; pr.crit=0;
      } else q.cd=0.5;
    }
  }
}
var PETNAME={rabbit:'몽이',chick:'삐약',fox:'루비'};
function unlockPet(zi){
  var order=['rabbit','chick','fox'], id=order[zi];
  if(!S.pets) S.pets={};
  if(id && !S.pets[id]){
    S.pets[id]=1;
    setTimeout(function(){ banner('새 친구!',PETNAME[id]+'가 함께해요',1600); },1800);
    rebuildPets();
  }
}
function rebuildPets(){
  pets.length=0;
  if(!S.pets) return;
  var k=Object.keys(S.pets);
  for(var i=0;i<k.length&&pets.length<3;i++)
    if(S.pets[k[i]]) pets.push({id:k[i],x:P.x,y:P.y,cd:Math.random()*1.4,bob:Math.random()*6.28,lv:S.pets[k[i]]});
}

function update(dt){
  if(G.shake>0){ G.shake-=dt*46; if(G.shake<0) G.shake=0; }
  if(G.flash>0){ G.flash-=dt*3.2; if(G.flash<0) G.flash=0; }
  if(G.fadeDir!==0){
    G.fade+=dt*2.4*G.fadeDir;
    if(G.fade>=1 && G.fadeDir>0){
      G.fade=1; G.fadeDir=-1;
      enterZone(G.nextZone);
      banner(ZONE[S.zone].n,'새로운 숲이다!',2200);
    } else if(G.fade<=0 && G.fadeDir<0){ G.fade=0; G.fadeDir=0; }
    if(G.fadeDir>0) return;
  }
  updatePlayer(dt);
  updateInhale(dt);
  updateEnemies(dt);
  updateCamps(dt);
  updateInteract(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateLoot(dt);
  updateDN(dt);
  updatePets(dt);
  updateAmb(dt);
  clampCam(false);
}
