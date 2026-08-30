/* ============================================================================
   월드 아트 — 쿼터뷰 지형(부드러운 페인팅) + 소품(세워진 스프라이트)
   ========================================================================== */
var T_GRASS=0, T_PATH=1, T_TALL=2, T_WATER=3, T_SAND=4, T_ROCK=5, T_FLOWER=6;
var TS=64;                    /* 타일 한 변(월드 픽셀) */
var WW=1840, WH=1440;         /* 월드 크기 */
var COLS=Math.floor(WW/TS), ROWS=Math.floor(WH/TS);
var GS=0.72;                  /* 지형 캔버스 배율 */

/* 지역별 지형 팔레트 */
var TERR=[
 { grass:['#79CE5C','#5FAF46'], grass2:'#8FDC72', path:'#D2AE78', pathEdge:'#B98F58',
   tall:'#3E9B3A', water:['#63C8F0','#2E92C4'], sand:'#F0DCA8', rock:'#A79A88', rockTop:'#C4B8A6',
   flower:['#FF9FC4','#FFE47A','#FFFFFF'], amb:'#FFF3B0' },
 { grass:['#4A5C86','#38466A'], grass2:'#5A6E9C', path:'#6B5F8E', pathEdge:'#514678',
   tall:'#2E5A48', water:['#6A7FE0','#3B4BA8'], sand:'#7C7096', rock:'#5B5178', rockTop:'#7A6E9A',
   flower:['#C6FF8A','#9FE6FF','#E3D4FF'], amb:'#C6FF8A' },
 { grass:['#C2603A','#9A431F'], grass2:'#D4744A', path:'#E0A870', pathEdge:'#B87A42',
   tall:'#8E4028', water:['#FF9A52','#E0561C'], sand:'#F0C48A', rock:'#8A5038', rockTop:'#A8664A',
   flower:['#FFD34E','#FF8A3D','#FFF0A0'], amb:'#FFD07A' },
 { grass:['#DFEEF8','#B9D6E8'], grass2:'#EFF8FF', path:'#C8D8E4', pathEdge:'#A8BECE',
   tall:'#8FBBD4', water:['#8FE3FF','#4FA8D8'], sand:'#E8F2F8', rock:'#93A8B8', rockTop:'#B4C6D2',
   flower:['#FFFFFF','#BFE9FF','#D9C4FF'], amb:'#DFF6FF' }
];

/* ---------- 소품 그리기 (120×120 정규화, 밑동 y=112) ---------- */
function drawProp(g, kind, zi, vr){
  var T=TERR[zi], Z=ZONE[zi], OC = zi===1? '#221A38' : dark(Z.tree2,.46);
  var r = mulberry32(vr*7919+zi*131+kind.length*17);
  function pen(fill,lw){ g.lineJoin='round'; g.lineCap='round'; g.lineWidth=lw||5.2; g.strokeStyle=OC; g.stroke(); if(fill){ g.fillStyle=fill; g.fill(); } }

  if(kind==='tree'){
    var th=104, tType = zi===0?'leafy' : zi===1?'conifer' : zi===2?'spire':'conifer';
    SNOWY = (zi===3);
    drawTree(g, 60, 112, th*(vr%2?1:0.86), Z.tree, Z.tree2, tType, r, OC);
    SNOWY=false;
  }
  else if(kind==='bush'){
    drawBush(g, 60, 112, 30+(vr%2)*7, lite(Z.tree,.22), Z.tree2, OC, r);
  }
  else if(kind==='rock'){
    var rs = vr%2? 34:24;
    g.beginPath();
    g.moveTo(60-rs, 112);
    g.lineTo(60-rs*0.82, 112-rs*1.05);
    g.lineTo(60-rs*0.2, 112-rs*1.42);
    g.lineTo(60+rs*0.55, 112-rs*1.12);
    g.lineTo(60+rs, 112);
    g.closePath();
    var rg=g.createLinearGradient(60-rs,112-rs*1.4,60+rs,112);
    rg.addColorStop(0,T.rockTop); rg.addColorStop(1,dark(T.rock,.20));
    pen(rg);
    g.beginPath();
    g.moveTo(60-rs*0.8,112-rs*1.02); g.lineTo(60-rs*0.18,112-rs*1.38); g.lineTo(60+rs*0.3,112-rs*1.08);
    g.closePath(); g.fillStyle=rgba('#FFFFFF',.24); g.fill();
  }
  else if(kind==='stump'){
    g.beginPath(); ellA(g,60,104,26,11); pen('#7A5230');
    g.beginPath();
    g.moveTo(34,104); g.lineTo(36,80); g.lineTo(84,80); g.lineTo(86,104); g.closePath(); pen('#8A5A32');
    g.beginPath(); ellA(g,60,80,24,10); pen('#C49A6A');
    g.beginPath(); ellA(g,60,80,13,5); g.lineWidth=3; g.strokeStyle='#8A6A44'; g.stroke();
  }
  else if(kind==='sign'){
    g.beginPath(); g.moveTo(56,112); g.lineTo(56,64); g.lineTo(64,64); g.lineTo(64,112); g.closePath(); pen('#8A5A32');
    g.beginPath();
    g.moveTo(26,66); g.lineTo(94,66); g.lineTo(94,40); g.lineTo(26,40); g.closePath(); pen('#C99A5E');
    g.beginPath(); g.moveTo(36,50); g.lineTo(74,50); g.moveTo(36,58); g.lineTo(62,58);
    g.lineWidth=4; g.strokeStyle='#6E4527'; g.stroke();
  }
  else if(kind==='hut'){
    g.beginPath();
    g.moveTo(18,112); g.lineTo(18,62); g.lineTo(102,62); g.lineTo(102,112); g.closePath();
    var hg=g.createLinearGradient(18,62,102,112);
    hg.addColorStop(0,'#E6C79A'); hg.addColorStop(1,'#BE976A'); pen(hg);
    g.beginPath();
    g.moveTo(6,64); g.lineTo(60,20); g.lineTo(114,64); g.closePath();
    var rg2=g.createLinearGradient(6,20,114,64);
    rg2.addColorStop(0,'#FF8F7A'); rg2.addColorStop(1,'#D4523E'); pen(rg2);
    g.beginPath(); g.moveTo(46,112); g.lineTo(46,78); g.lineTo(74,78); g.lineTo(74,112); g.closePath(); pen('#7A5230');
    g.beginPath(); ellA(g,32,80,9,9); pen('#9FE6FF',4);
    g.beginPath(); ellA(g,88,80,9,9); pen('#9FE6FF',4);
  }
  else if(kind==='fire'){
    g.beginPath(); ellA(g,60,106,30,11); pen(T.rock);
    for(var i=0;i<4;i++){
      var a=i*0.9-1.2;
      g.beginPath();
      g.moveTo(60+Math.cos(a)*26, 104+Math.sin(a)*7);
      g.lineTo(60-Math.cos(a)*8, 84);
      g.lineWidth=8; g.strokeStyle=OC; g.stroke();
      g.lineWidth=5; g.strokeStyle='#8A5A32'; g.stroke();
    }
    g.beginPath();
    g.moveTo(60,44); g.quadraticCurveTo(80,72,72,88);
    g.quadraticCurveTo(60,100,48,88); g.quadraticCurveTo(40,72,60,44); g.closePath();
    var fg=g.createLinearGradient(0,44,0,96);
    fg.addColorStop(0,'#FFF6B0'); fg.addColorStop(.5,'#FFB03D'); fg.addColorStop(1,'#F0512B');
    g.fillStyle=fg; g.fill();
  }
  else if(kind==='chest' || kind==='chestOpen'){
    g.beginPath();
    g.moveTo(22,112); g.lineTo(22,74); g.lineTo(98,74); g.lineTo(98,112); g.closePath();
    var cg=g.createLinearGradient(22,74,98,112);
    cg.addColorStop(0,'#C99A5E'); cg.addColorStop(1,'#8A5A32'); pen(cg);
    if(kind==='chest'){
      g.beginPath();
      g.moveTo(22,74); g.quadraticCurveTo(60,40,98,74); g.closePath();
      var lg3=g.createLinearGradient(22,44,98,74);
      lg3.addColorStop(0,'#E7B87A'); lg3.addColorStop(1,'#A87038'); pen(lg3);
      g.beginPath(); g.moveTo(52,68); g.lineTo(68,68); g.lineTo(68,88); g.lineTo(52,88); g.closePath(); pen('#FFD34E');
    } else {
      g.save(); g.translate(60,74); g.rotate(-0.95); g.translate(-60,-74);
      g.beginPath(); g.moveTo(22,74); g.quadraticCurveTo(60,40,98,74); g.closePath(); pen('#A87038'); g.restore();
      g.beginPath(); ellA(g,60,86,26,12); g.fillStyle='rgba(255,220,120,.55)'; g.fill();
    }
  }
  else if(kind==='gate' || kind==='gateOpen'){
    var open = kind==='gateOpen';
    for(var s=-1;s<=1;s+=2){
      g.beginPath();
      g.moveTo(60+s*54-9, 112); g.lineTo(60+s*54-9, 34); g.lineTo(60+s*54+9, 34); g.lineTo(60+s*54+9, 112);
      g.closePath();
      var pg=g.createLinearGradient(0,34,0,112);
      pg.addColorStop(0,T.rockTop); pg.addColorStop(1,dark(T.rock,.24)); pen(pg);
    }
    g.beginPath(); g.moveTo(0,36); g.lineTo(120,36); g.lineTo(120,20); g.lineTo(0,20); g.closePath();
    pen(T.rockTop);
    if(open){
      var og=g.createRadialGradient(60,80,4,60,80,46);
      og.addColorStop(0,'rgba(255,243,196,.95)'); og.addColorStop(1,'rgba(255,243,196,0)');
      g.beginPath(); ellA(g,60,80,42,34); g.fillStyle=og; g.fill();
    } else {
      g.beginPath(); g.moveTo(18,44); g.lineTo(102,44); g.lineTo(102,110); g.lineTo(18,110); g.closePath();
      pen('#6E5A44');
      for(var b=1;b<4;b++){ g.beginPath(); g.moveTo(18,44+b*17); g.lineTo(102,44+b*17); g.lineWidth=4; g.strokeStyle=dark('#6E5A44',.3); g.stroke(); }
      g.beginPath(); ellA(g,60,78,13,13); pen('#FFD34E',4);
    }
  }
  else if(kind==='flower'){
    for(var f=0;f<5;f++){
      var fx=28+r()*64, fy=86+r()*22, fc=T.flower[(r()*T.flower.length)|0], fr=6+r()*3;
      g.beginPath(); g.moveTo(fx,fy+10); g.lineTo(fx,fy);
      g.lineWidth=3; g.strokeStyle='#4E9E3E'; g.stroke();
      for(var q=0;q<5;q++){
        var qa=q*1.2566;
        g.beginPath(); ellA(g, fx+Math.cos(qa)*fr*0.8, fy+Math.sin(qa)*fr*0.8, fr*0.62, fr*0.62);
        g.fillStyle=fc; g.fill();
      }
      g.beginPath(); ellA(g,fx,fy,fr*0.42,fr*0.42); g.fillStyle='#FFE47A'; g.fill();
    }
  }
  else if(kind==='tuft'){
    for(var t2=0;t2<4;t2++){
      var gx=36+r()*48, gh=18+r()*16;
      g.beginPath(); g.moveTo(gx-4,112);
      g.quadraticCurveTo(gx-2+(r()-0.5)*10, 112-gh*0.6, gx+(r()-0.5)*12, 112-gh);
      g.quadraticCurveTo(gx+4, 112-gh*0.5, gx+4,112); g.closePath();
      g.fillStyle=lite(T.tall,.20); g.fill();
      g.lineWidth=2.4; g.strokeStyle=rgba(dark(T.tall,.3),.7); g.stroke();
    }
  }
  else if(kind==='crystal'){
    for(var c2=0;c2<3;c2++){
      var cx2=48+c2*14, ch2=34+ (c2===1?24:0);
      g.beginPath();
      g.moveTo(cx2, 112-ch2); g.lineTo(cx2+9, 112-ch2*0.4); g.lineTo(cx2+5, 112); g.lineTo(cx2-6,112); g.lineTo(cx2-9,112-ch2*0.4);
      g.closePath();
      var xg=g.createLinearGradient(cx2-9,112-ch2,cx2+9,112);
      xg.addColorStop(0,'#FFFFFF'); xg.addColorStop(1, T.water[0]);
      pen(xg,4);
    }
  }
}

/* 소품 사양 : [높이(월드px), 충돌반경, 충돌?] */
var PROP_SPEC={
  tree:      [156, 20, 1], bush:[80,20,1], rock:[74,22,1], stump:[58,17,1],
  sign:      [84, 13, 1], hut:[210, 62, 1], fire:[72,17,1],
  chest:     [72, 22, 1], chestOpen:[72,22,1],
  gate:      [190, 0, 0], gateOpen:[190,0,0],
  flower:    [46, 0, 0], tuft:[44,0,0], crystal:[70,18,1]
};
var PROP_KINDS=Object.keys(PROP_SPEC);

function bakeProps(zi){
  SPR.prop={};
  for(var i=0;i<PROP_KINDS.length;i++){
    var k=PROP_KINDS[i], spec=PROP_SPEC[k];
    var vars = (k==='tree'||k==='rock'||k==='bush'||k==='flower'||k==='tuft')?2:1;
    SPR.prop[k]=[];
    for(var v=0;v<vars;v++){
      var px=Math.round(Math.min(300, spec[0]*1.35));
      var c=nc(px,px), g=c.getContext('2d'), sc=px/120;
      g.setTransform(sc,0,0,sc,0,0);
      drawProp(g,k,zi,v+1);
      g.setTransform(1,0,0,1,0,0);
      SPR.prop[k].push(c);
    }
  }
}

/* ---------- 지형 페인팅 ---------- */
function paintGround(WD){
  var zi=WD.zi, T=TERR[zi], rnd=mulberry32(9001+zi*613);
  var gw=Math.round(WW*GS), gh=Math.round(WH*GS);
  var c=nc(gw,gh), g=c.getContext('2d',{alpha:false});
  g.setTransform(GS,0,0,GS,0,0);
  /* 잔디 바탕 */
  var bg=g.createLinearGradient(0,0,WW*0.4,WH);
  bg.addColorStop(0,T.grass[0]); bg.addColorStop(1,T.grass[1]);
  g.fillStyle=bg; g.fillRect(0,0,WW,WH);
  for(var i=0;i<900;i++){
    var x=rnd()*WW, y=rnd()*WH, rr=6+rnd()*22;
    g.beginPath(); ellA(g,x,y,rr,rr*0.6);
    g.fillStyle=rgba(rnd()<0.5?T.grass2:T.grass[1], 0.16+rnd()*0.18); g.fill();
  }
  /* 지형 블롭 : 같은 종류끼리 자연스럽게 이어붙음 */
  function layer(type,color,pad,alpha){
    g.save(); g.globalAlpha=alpha||1; g.fillStyle=color;
    for(var ty=0;ty<ROWS;ty++) for(var tx=0;tx<COLS;tx++){
      if(WD.tiles[ty*COLS+tx]!==type) continue;
      var px=tx*TS, py=ty*TS;
      g.beginPath();
      var rad=TS*0.42+pad;
      g.moveTo(px-pad+rad,py-pad);
      g.arcTo(px+TS+pad,py-pad,px+TS+pad,py+TS+pad,rad);
      g.arcTo(px+TS+pad,py+TS+pad,px-pad,py+TS+pad,rad);
      g.arcTo(px-pad,py+TS+pad,px-pad,py-pad,rad);
      g.arcTo(px-pad,py-pad,px+TS+pad,py-pad,rad);
      g.closePath(); g.fill();
    }
    g.restore();
  }
  layer(T_SAND, T.sand, 12);
  layer(T_PATH, T.pathEdge, 10);
  layer(T_PATH, T.path, 2);
  layer(T_WATER, dark(T.water[1],.28), 6);
  layer(T_WATER, T.water[1], 0);
  layer(T_TALL, dark(T.tall,.10), 8);
  layer(T_TALL, T.tall, 2);
  layer(T_ROCK, dark(T.rock,.30), 10);
  layer(T_ROCK, T.rock, 2);

  /* 물 반짝임 */
  g.save();
  for(var w=0;w<170;w++){
    var wx=rnd()*WW, wy=rnd()*WH;
    var tt=WD.tiles[(Math.floor(wy/TS))*COLS+Math.floor(wx/TS)];
    if(tt!==T_WATER) continue;
    g.beginPath(); ellA(g,wx,wy,10+rnd()*16,3+rnd()*4);
    g.fillStyle=rgba('#FFFFFF',0.16+rnd()*0.22); g.fill();
  }
  g.restore();
  /* 길 위 자갈 */
  for(var p2=0;p2<260;p2++){
    var pxx=rnd()*WW, pyy=rnd()*WH;
    var t3=WD.tiles[(Math.floor(pyy/TS))*COLS+Math.floor(pxx/TS)];
    if(t3!==T_PATH) continue;
    g.beginPath(); ellA(g,pxx,pyy,2+rnd()*4,1.6+rnd()*2.4);
    g.fillStyle=rgba(T.pathEdge,0.5+rnd()*0.3); g.fill();
  }
  /* 바위 지대 밝은 면 */
  for(var q2=0;q2<200;q2++){
    var qx=rnd()*WW, qy=rnd()*WH;
    var t4=WD.tiles[(Math.floor(qy/TS))*COLS+Math.floor(qx/TS)];
    if(t4!==T_ROCK) continue;
    g.beginPath(); ellA(g,qx,qy,8+rnd()*16,5+rnd()*8);
    g.fillStyle=rgba(T.rockTop,0.28+rnd()*0.25); g.fill();
  }
  g.setTransform(1,0,0,1,0,0);
  return c;
}

/* 미니맵 */
function paintMinimap(WD){
  var zi=WD.zi, T=TERR[zi], mw=132, mh=Math.round(mw*WH/WW);
  var c=nc(mw,mh), g=c.getContext('2d');
  var sx=mw/COLS, sy=mh/ROWS;
  for(var ty=0;ty<ROWS;ty++) for(var tx=0;tx<COLS;tx++){
    var t=WD.tiles[ty*COLS+tx], col;
    if(t===T_WATER) col=T.water[1];
    else if(t===T_ROCK) col=T.rock;
    else if(t===T_PATH) col=T.path;
    else if(t===T_SAND) col=T.sand;
    else if(t===T_TALL) col=T.tall;
    else col=T.grass[0];
    g.fillStyle=col; g.fillRect(tx*sx, ty*sy, sx+1, sy+1);
  }
  return c;
}
