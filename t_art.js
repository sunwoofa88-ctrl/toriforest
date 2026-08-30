/* ---- 아트 검증 하네스 ---- */
var names = Object.keys(CREA);
var COL = 5, CELL = 190;
var rows = Math.ceil((names.length+4)/COL);
var cv = nc(COL*CELL, rows*CELL+40);
var g = cv.getContext('2d');
g.fillStyle='#BFE8C6'; g.fillRect(0,0,cv.width,cv.height);
var list = [{k:'HERO', sp:HERO_SPEC}];
for(var i=0;i<names.length;i++) list.push({k:names[i], sp:CREA[names[i]]});
var pk = Object.keys(PET);
for(var j=0;j<pk.length;j++) list.push({k:'pet:'+pk[j], sp:PET[pk[j]]});
for(var n=0;n<list.length;n++){
  var cx=(n%COL)*CELL, cy=Math.floor(n/COL)*CELL;
  g.save(); g.translate(cx,cy);
  g.fillStyle = (n%2)?'#D8F2DC':'#CBEBD2'; g.fillRect(4,4,CELL-8,CELL-8);
  var s = bake(list[n].sp, 176);
  g.drawImage(s, (CELL-176)/2, 2);
  g.fillStyle='#2C2119'; g.font='16px sans-serif'; g.textAlign='center';
  g.fillText(list[n].k, CELL/2, CELL-8);
  g.restore();
}
document.body.innerHTML='';
document.body.style.cssText='margin:0;background:#BFE8C6';
cv.style.cssText='display:block;width:'+cv.width+'px';
document.body.appendChild(cv);
window.__ready = true;
