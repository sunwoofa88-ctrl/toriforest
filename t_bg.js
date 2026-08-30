var W=430, H=560, GY=Math.round(H*0.76);
var sheet=nc(W*2+24,H*2+24), sg=sheet.getContext('2d');
sg.fillStyle='#111'; sg.fillRect(0,0,sheet.width,sheet.height);
for(var z=0;z<4;z++){
  var L=bakeZone(z,W,H,GY); var c=nc(W,H), g=c.getContext('2d');
  g.drawImage(L.sky,0,0); var sc=140;
  function tile(img,tw,y,off){var s=-((off%tw)+tw)%tw;for(var x=s;x<W;x+=tw)g.drawImage(img,x,y);}
  tile(L.far,L.farW,GY-L.farH,sc*0.15);
  tile(L.mid,L.midW,GY-L.midH,sc*0.32);
  tile(L.near,L.nearW,GY-L.nearH+6,sc*0.58);
  tile(L.ground,L.groundW,GY-9,sc*1.0);
  function shadow(x,w){g.save();ell(g,x,GY+4,w*0.42,w*0.13);g.fillStyle='rgba(30,20,10,.28)';g.fill();g.restore();}
  var HS=132; shadow(W*0.22,HS*0.8);
  g.drawImage(bake(HERO_SPEC,180),W*0.22-HS/2,GY-HS*0.96,HS,HS);
  var mobs=ZONE[z].mobs;
  for(var m=0;m<3;m++){
    var mk=mobs[m%mobs.length],sp=CREA[MON[mk].art],sz=MON[mk].sz*1.12;
    shadow(W*(0.52+m*0.16),sz*0.8);
    g.drawImage(bake(sp,176),W*(0.52+m*0.16)-sz/2,GY-sz*0.96,sz,sz);
  }
  tile(L.fg,L.fgW,GY-9+L.groundH-L.fgH,sc*1.30);
  tile(L.canopy,L.canopyW,-4,sc*0.90);
  g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,0,W,26);
  g.fillStyle='#fff';g.font='16px sans-serif';g.fillText(ZONE[z].n,8,19);
  sg.drawImage(c,(z%2)*(W+8)+8,Math.floor(z/2)*(H+8)+8);
}
document.body.innerHTML='';document.body.style.cssText='margin:0;background:#111';
sheet.style.cssText='display:block;width:'+sheet.width+'px';document.body.appendChild(sheet);window.__ready=true;
