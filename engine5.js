
/* ============================================================================
   렌더 (쿼터뷰 · Y 정렬)
   ========================================================================== */
var BASE_F=112/120;
var DL=[], DLn=0, perfNow=0, hintInhale=false;
function dlPush(y,t,r){
  if(DLn<DL.length){ var o=DL[DLn]; o.y=y; o.t=t; o.r=r; }
  else DL.push({y:y,t:t,r:r});
  DLn++;
}
function dlSort(){
  for(var i=1;i<DLn;i++){
    var a=DL[i], j=i-1;
    while(j>=0 && DL[j].y>a.y){ DL[j+1]=DL[j]; j--; }
    DL[j+1]=a;
  }
}
function shadowAt(sx,sy,S,alpha){
  ctx.globalAlpha=alpha||0.26;
  ctx.fillStyle='#1C1408';
  ctx.beginPath(); ctx.ellipse(sx,sy,S*0.23,S*0.085,0,0,6.2832); ctx.fill();
  ctx.globalAlpha=1;
}
function rrect(x,y,w,h,r){
  r=r||h/2; ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function render(){
  perfNow+=0.0167; hintInhale=false;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(!WD){ ctx.fillStyle='#3E7A46'; ctx.fillRect(0,0,W,H); return; }
  var sx=0,sy=0;
  if(G.shake>0.05){ sx=(Math.random()-0.5)*G.shake; sy=(Math.random()-0.5)*G.shake; }
  ctx.translate(sx,sy);

  /* --- 지형 --- */
  var gw=WD.ground.width, gh=WD.ground.height;
  var srcX=Math.max(0,Math.min(gw-1, cam.x*GS)), srcY=Math.max(0,Math.min(gh-1, cam.y*GS));
  var srcW=Math.min(gw-srcX, W*GS), srcH=Math.min(gh-srcY, H*GS);
  ctx.fillStyle=TERR[S.zone].grass[1]; ctx.fillRect(-8,-8,W+16,H+16);
  ctx.drawImage(WD.ground, srcX,srcY,srcW,srcH, 0,0, srcW/GS, srcH/GS);

  /* --- 그릴 목록 수집 --- */
  DLn=0;
  var vx0=cam.x-140, vx1=cam.x+W+140, vy0=cam.y-260, vy1=cam.y+H+160;
  var g0=Math.max(0,Math.floor(vx0/256)), g1=Math.min(WD.GW-1,Math.floor(vx1/256));
  var h0=Math.max(0,Math.floor(vy0/256)), h1=Math.min(WD.GH-1,Math.floor(vy1/256));
  for(var gy=h0;gy<=h1;gy++) for(var gx=g0;gx<=g1;gx++){
    var cell=WD.grid[gy*WD.GW+gx];
    for(var ci=0;ci<cell.length;ci++){
      var pr=cell[ci];
      if(pr.x<vx0||pr.x>vx1||pr.y<vy0||pr.y>vy1) continue;
      dlPush(pr.y,0,pr);
    }
  }
  var i;
  for(i=0;i<EN.length;i++){ var e=EN[i]; if(e.alive) dlPush(e.y,1,e); }
  for(i=0;i<pets.length;i++) dlPush(pets[i].y,2,pets[i]);
  for(i=0;i<LT.length;i++){ var l=LT[i]; if(l.alive) dlPush(l.y,3,l); }
  if(!P.dead||P.deadT>0) dlPush(P.y,4,P);
  dlSort();

  /* --- 그리기 --- */
  for(i=0;i<DLn;i++){
    var it=DL[i], o=it.r;
    var px=o.x-cam.x, py=o.y-cam.y;
    if(it.t===0){                                  /* 소품 */
      var arr=SPR.prop[o.k]; if(!arr) continue;
      var img=arr[o.v%arr.length], Sz=o.h;
      if(PROP_SPEC[o.k][1]>0) shadowAt(px,py,Sz*0.9,0.22);
      ctx.drawImage(img, px-Sz/2, py-Sz*BASE_F, Sz, Sz);
    }
    else if(it.t===1) drawEnemy(o,px,py);
    else if(it.t===2) drawPet(o,px,py);
    else if(it.t===3){
      if(!o.spr) continue;
      var ls=32*SC;
      ctx.globalAlpha=0.22; ctx.fillStyle='#1C1408';
      ctx.beginPath(); ctx.ellipse(px,py,ls*0.28,ls*0.10,0,0,6.2832); ctx.fill(); ctx.globalAlpha=1;
      ctx.drawImage(o.spr, px-ls/2, py-o.z-ls, ls, ls);
    }
    else drawHero(px,py);
  }

  /* --- 발사체 --- */
  for(var pi=0;pi<PR.length;pi++){
    var p=PR[pi]; if(!p.alive) continue;
    var ppx=p.x-cam.x, ppy=p.y-cam.y-(p.z||0);
    if(p.kind==='fx_slash'){
      var k=1-p.life/0.26;
      ctx.save(); ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=Math.pow(Math.max(0,1-k),0.55);
      ctx.translate(ppx,ppy-P.size*0.34); ctx.rotate(p.rot+(k-0.5)*0.5); ctx.scale(1,0.82);
      var sz=p.r*(0.62+k*0.62);
      ctx.drawImage(SPR.fx['slash_'+p.abil],-sz,-sz,sz*2,sz*2);
      ctx.restore();
    } else if(p.kind==='fx_ring'){
      var k2=1-p.life/0.42;
      ctx.save(); ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=Math.max(0,1-k2)*0.9;
      var s2=p.r*(0.2+k2*1.0);
      ctx.drawImage(SPR.fx.ring, ppx-s2, ppy-s2*0.42, s2*2, s2*0.84);
      ctx.restore();
    } else if(p.spr){
      if(p.z>4){ ctx.globalAlpha=0.18; ctx.fillStyle='#1C1408';
        ctx.beginPath(); ctx.ellipse(ppx,p.y-cam.y,p.r*0.7,p.r*0.24,0,0,6.2832); ctx.fill(); ctx.globalAlpha=1; }
      ctx.save(); ctx.translate(ppx,ppy); ctx.rotate(p.rot);
      var s3=p.r*2.1;
      if(p.kind==='pet'){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.95; }
      ctx.drawImage(p.spr,-s3/2,-s3/2,s3,s3);
      ctx.restore();
    }
  }

  /* --- 파티클 --- */
  for(var pj=0;pj<PT.length;pj++){
    var q=PT[pj]; if(!q.alive||q.add) continue;
    ctx.save(); ctx.globalAlpha=Math.max(0,q.fade);
    ctx.translate(q.x-cam.x,q.y-cam.y); ctx.rotate(q.rot);
    ctx.drawImage(q.spr,-q.size/2,-q.size/2,q.size,q.size); ctx.restore();
  }
  ctx.globalCompositeOperation='lighter';
  for(var pk=0;pk<PT.length;pk++){
    var q2=PT[pk]; if(!q2.alive||!q2.add) continue;
    ctx.save(); ctx.globalAlpha=Math.max(0,q2.fade)*0.9;
    ctx.translate(q2.x-cam.x,q2.y-cam.y); ctx.rotate(q2.rot);
    ctx.drawImage(q2.spr,-q2.size/2,-q2.size/2,q2.size,q2.size); ctx.restore();
  }
  ctx.globalCompositeOperation='source-over';

  drawAmb();

  /* --- 데미지 숫자 --- */
  ctx.textAlign='center'; ctx.lineJoin='round';
  for(var dn=0;dn<DN.length;dn++){
    var d=DN[dn]; if(!d.alive) continue;
    var kk=d.life/(d.crit===1?0.82:(d.crit===2?1.0:0.62));
    var scl=d.crit===1?(kk>0.8?1.6-(kk-0.8)*3:1.25):1;
    ctx.save(); ctx.globalAlpha=Math.min(1,kk*2.2);
    ctx.font='700 '+Math.round(d.size*scl)+'px Fredoka, Jua, sans-serif';
    ctx.lineWidth=Math.round(d.size*scl*0.30); ctx.strokeStyle='#2C2119';
    var dx2=Math.max(24,Math.min(W-24,d.x-cam.x));
    ctx.strokeText(d.txt,dx2,d.y-cam.y); ctx.fillStyle=d.color; ctx.fillText(d.txt,dx2,d.y-cam.y);
    ctx.restore();
  }
  if(P.combo>=3&&P.comboT>0){
    ctx.save(); ctx.globalAlpha=Math.min(1,P.comboT*2.4);
    var cs=22+Math.min(14,P.combo*0.5);
    ctx.font='700 '+cs+'px Fredoka, Jua, sans-serif';
    ctx.lineWidth=cs*0.30; ctx.strokeStyle='#2C2119';
    var ct='콤보 '+P.combo+'!';
    var cyy=Math.max(H*0.26,(P.y-cam.y)-P.size*1.5);
    ctx.strokeText(ct,P.x-cam.x,cyy); ctx.fillStyle='#FFD34E'; ctx.fillText(ct,P.x-cam.x,cyy);
    ctx.restore();
  }

  /* --- 보스 체력바 --- */
  var boss=null;
  for(var b0=0;b0<EN.length;b0++) if(EN[b0].alive&&!EN[b0].dead&&EN[b0].boss){ boss=EN[b0]; break; }
  if(boss){
    var bw=Math.min(W-56,420), bx=(W-bw)/2, by=H*0.17;
    ctx.save();
    ctx.fillStyle='rgba(44,33,25,.85)'; rrect(bx-4,by-4,bw+8,28); ctx.fill();
    ctx.fillStyle='#E7D7BC'; rrect(bx,by,bw,20); ctx.fill();
    var r0=Math.max(0,boss.hp/boss.hpMax);
    var bg6=ctx.createLinearGradient(0,by,0,by+20);
    bg6.addColorStop(0,'#FF9CC4'); bg6.addColorStop(1,'#D8437C');
    ctx.fillStyle=bg6; rrect(bx,by,bw*r0,20); ctx.fill();
    ctx.font='700 14px Jua, sans-serif'; ctx.textAlign='center';
    ctx.lineWidth=4; ctx.strokeStyle='#2C2119';
    ctx.strokeText(MON[boss.key].n,W/2,by+15); ctx.fillStyle='#fff'; ctx.fillText(MON[boss.key].n,W/2,by+15);
    ctx.restore();
  }

  ctx.setTransform(DPR,0,0,DPR,0,0);
  drawObjective();
  drawMinimap();
  drawStick();
  if(G.flash>0.01){ ctx.globalAlpha=Math.min(0.42,G.flash*0.62); ctx.fillStyle=G.flashCol; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
  if(G.fade>0.001){ ctx.globalAlpha=Math.min(1,G.fade); ctx.fillStyle='#14240F'; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
}

function drawEnemy(e,px,py){
  var spr=SPR.mob[e.key]; if(!spr) return;
  var sz=e.size, sq=e.sq, sxx=sq, syy=2-sq;
  if(e.dead){ sxx=e.sq*1.5; syy=e.sq*1.5; }
  var hy=py-e.hover;
  shadowAt(px,py,sz*(e.fly?0.7:1),e.fly?0.16:0.26);
  ctx.save();
  ctx.translate(px,hy+Math.sin(e.bob)*(e.fly?4:2.2));
  ctx.scale(e.dir<0?-1:1,1);
  ctx.globalAlpha=e.dead?Math.max(0,e.deadT/0.34):1;
  ctx.drawImage(spr,-sz*sxx*0.5,-sz*syy*BASE_F,sz*sxx,sz*syy);
  if(e.hitT>0){ ctx.globalAlpha=Math.min(1,e.hitT/0.14)*0.92;
    ctx.drawImage(SPR.mobF[e.key],-sz*sxx*0.5,-sz*syy*BASE_F,sz*sxx,sz*syy); }
  else if(e.freeze>0){ ctx.globalAlpha=0.55;
    ctx.drawImage(SPR.mobI[e.key],-sz*sxx*0.5,-sz*syy*BASE_F,sz*sxx,sz*syy); }
  ctx.restore();
  if(!e.dead&&!e.boss&&e.hp<e.hpMax){
    var bw=sz*0.60, bx=px-bw/2, by=hy-sz*0.99;
    ctx.fillStyle='rgba(44,33,25,.75)'; rrect(bx-2,by-2,bw+4,9); ctx.fill();
    ctx.fillStyle='#4CC93E'; rrect(bx,by,bw*Math.max(0,e.hp/e.hpMax),5); ctx.fill();
  }
  if(!e.dead&&!e.boss&&!MON[e.key].tough&&!S.tut2){
    var pz=1+Math.sin(perfNow*7)*0.14;
    ctx.save(); ctx.translate(px,hy-sz*1.16); ctx.scale(pz,pz);
    ctx.font='700 30px Jua, sans-serif'; ctx.textAlign='center';
    ctx.lineWidth=8; ctx.strokeStyle='#2C2119'; ctx.strokeText('!',0,0);
    ctx.fillStyle='#FFD34E'; ctx.fillText('!',0,0); ctx.restore();
    hintInhale=true;
  }
  if(!e.dead&&e.tele>0){
    ctx.save(); ctx.globalAlpha=0.30+Math.sin(e.tele*40)*0.26;
    ctx.fillStyle='#FF5E5E'; ctx.beginPath();
    ctx.ellipse(px,py,SLAM_R(),SLAM_R()*0.42,0,0,6.2832); ctx.fill(); ctx.restore();
  }
  if(!e.dead&&e.stun>0){
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(var s=0;s<3;s++){
      var a=e.stun*7+s*2.09; ctx.globalAlpha=0.8;
      ctx.drawImage(SPR.fx.spark,px+Math.cos(a)*sz*0.34-9,hy-sz*1.06+Math.sin(a)*7-9,18,18);
    }
    ctx.restore();
  }
}
function drawPet(q,px,py){
  var spr=SPR.pet[q.id]; if(!spr) return;
  var sz=Math.round(62*SC);
  var hop=Math.abs(Math.sin(q.bob*1.7))*10*SC;
  shadowAt(px,py,sz,0.20);
  ctx.save(); ctx.translate(px,py-hop); ctx.scale(P.facing<0?-1:1,1);
  ctx.drawImage(spr,-sz*0.5,-sz*BASE_F,sz,sz); ctx.restore();
}
function drawHero(px,py){
  var st='idle';
  if(P.dead) st='ko';
  else if(P.hurtT>0) st='hurt';
  else if(P.inhaleT>0.15) st='inhale';
  else if(P.atkT>0) st='atk';
  else if(P.blink>0) st='blink';
  var spr=SPR.hero[st]||SPR.hero.idle;
  var sz=P.size, sq=P.squash, sxx=sq, syy=2-sq;
  var bob=P.moving? Math.abs(Math.sin(P.step))*5*SC : Math.sin(P.bob)*2.4;
  shadowAt(px,py,sz,0.28);
  var blinkHide=(P.invT>0&&!P.dead&&Math.floor(P.invT*14)%2===0);
  ctx.save();
  ctx.translate(px,py-bob);
  ctx.scale(P.facing<0?-1:1,1);
  if(blinkHide) ctx.globalAlpha=0.42;
  if(P.dead) ctx.rotate(0.5);
  var wsp=SPR.abil[S.abil+'_'+abilTier(S.abil)];
  var swing=P.atkT>0?(-0.70+(1-P.atkT/0.24)*2.70):(0.34+Math.sin(P.bob*0.8)*0.08);
  if(wsp&&!P.dead&&P.inhaleT<=0.15){
    var WS=sz*0.72;
    ctx.save(); ctx.translate(sz*0.38,-sz*0.42); ctx.rotate(swing);
    ctx.drawImage(wsp,-WS*0.50,-WS*0.90,WS,WS); ctx.restore();
  }
  ctx.drawImage(spr,-sz*sxx*0.5,-sz*syy*BASE_F,sz*sxx,sz*syy);
  if(P.hurtT>0){ ctx.globalAlpha=Math.min(1,P.hurtT/0.45)*0.8;
    ctx.drawImage(SPR.heroF,-sz*sxx*0.5,-sz*syy*BASE_F,sz*sxx,sz*syy); }
  ctx.restore();
  if(P.inhaleT>0.05){
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=0.18*P.inhaleT;
    var rng=(170+S.lv*2.2)*SC, a0=Math.atan2(P.fy,P.fx);
    ctx.beginPath();
    ctx.moveTo(px+P.fx*sz*0.3, py-sz*0.42+P.fy*sz*0.3);
    ctx.arc(px+P.fx*sz*0.3, py-sz*0.42+P.fy*sz*0.3, rng, a0-0.62, a0+0.62);
    ctx.closePath(); ctx.fillStyle='#FFFFFF'; ctx.fill();
    ctx.restore();
  }
}

/* --- 목표 안내 화살표 --- */
function objTarget(){
  var pg=prog();
  if(!pg.boss && pg.kills>=killNeed()) return {x:WD.arena.x,y:WD.arena.y,label:'보스'};
  if(pg.boss) return {x:WD.exitGate.x,y:WD.exitGate.y,label:'다음 숲'};
  var best=null,bd=1e9;
  for(var i=0;i<WD.camps.length;i++){
    var c=WD.camps[i], dx=c.x-P.x, dy=c.y-P.y, d=dx*dx+dy*dy;
    if(d<bd){bd=d;best=c;}
  }
  return best? {x:best.x,y:best.y,label:'몬스터'} : null;
}
function drawObjective(){
  var t=objTarget(); if(!t) return;
  var sx=t.x-cam.x, sy=t.y-cam.y;
  var m=52;
  if(sx>m&&sx<W-m&&sy>m+80&&sy<H-m-90) return;
  var cx=W/2, cy=H/2;
  var dx=sx-cx, dy=sy-cy, ang=Math.atan2(dy,dx);
  var rx=Math.min(W/2-m, Math.abs(Math.cos(ang))>0.001? Math.abs((W/2-m)/Math.cos(ang))*Math.abs(Math.cos(ang)) : W/2-m);
  var L=Math.min((W/2-m)/Math.max(0.0001,Math.abs(Math.cos(ang))), (H/2-m-40)/Math.max(0.0001,Math.abs(Math.sin(ang))));
  var ax=cx+Math.cos(ang)*L, ay=cy+Math.sin(ang)*L;
  ctx.save();
  ctx.translate(ax,ay); ctx.rotate(ang);
  var pulse=1+Math.sin(perfNow*6)*0.10;
  ctx.scale(pulse,pulse);
  ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(-12,-15); ctx.lineTo(-5,0); ctx.lineTo(-12,15); ctx.closePath();
  ctx.lineWidth=5; ctx.strokeStyle='#2C2119'; ctx.lineJoin='round'; ctx.stroke();
  ctx.fillStyle='#FFD34E'; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.font='700 13px Jua, sans-serif'; ctx.textAlign='center';
  ctx.lineWidth=5; ctx.strokeStyle='#2C2119';
  var ty=ay+(dy>0?32:-26);
  ctx.strokeText(t.label,ax,ty); ctx.fillStyle='#fff'; ctx.fillText(t.label,ax,ty);
  ctx.restore();
}

/* --- 미니맵 --- */
function drawMinimap(){
  if(!WD.mini) return;
  var mw=Math.round(Math.min(112, W*0.26)), mh=Math.round(mw*WH/WW);
  var mx=W-mw-10, my=H-mh-Math.round(H*0.20)-6;
  if(my<96) my=96;
  ctx.save();
  ctx.globalAlpha=0.90;
  ctx.fillStyle='#2C2119'; rrect(mx-4,my-4,mw+8,mh+8,8); ctx.fill();
  ctx.drawImage(WD.mini,mx,my,mw,mh);
  var sxr=mw/WW, syr=mh/WH;
  var pg=prog();
  /* 캠프 */
  for(var i=0;i<WD.camps.length;i++){
    var c=WD.camps[i];
    ctx.fillStyle='#FF6FA5'; ctx.beginPath();
    ctx.arc(mx+c.x*sxr,my+c.y*syr,2.6,0,6.2832); ctx.fill();
  }
  /* 상자 */
  for(i=0;i<WD.chests.length;i++){
    if(pg.chests&&pg.chests[i]) continue;
    ctx.fillStyle='#FFD34E'; ctx.beginPath();
    ctx.arc(mx+WD.chests[i].x*sxr,my+WD.chests[i].y*syr,2.6,0,6.2832); ctx.fill();
  }
  /* 목표 */
  var t=objTarget();
  if(t){ ctx.strokeStyle='#FFFFFF'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(mx+t.x*sxr,my+t.y*syr,5+Math.sin(perfNow*6)*1.4,0,6.2832); ctx.stroke(); }
  /* 플레이어 */
  ctx.fillStyle='#FFFFFF'; ctx.strokeStyle='#2C2119'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(mx+P.x*sxr,my+P.y*syr,3.6,0,6.2832); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* --- 조이스틱 --- */
function drawStick(){
  if(!stick.on) return;
  ctx.save();
  ctx.globalAlpha=0.34;
  ctx.beginPath(); ctx.arc(stick.ox,stick.oy,STICK_R,0,6.2832);
  ctx.fillStyle='#FFF7E4'; ctx.fill();
  ctx.lineWidth=5; ctx.strokeStyle='#2C2119'; ctx.stroke();
  ctx.globalAlpha=0.72;
  ctx.beginPath(); ctx.arc(stick.kx,stick.ky,STICK_R*0.44,0,6.2832);
  ctx.fillStyle='#FFD34E'; ctx.fill();
  ctx.lineWidth=4; ctx.strokeStyle='#2C2119'; ctx.stroke();
  ctx.restore();
}
