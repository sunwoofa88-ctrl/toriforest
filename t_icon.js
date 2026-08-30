S = defaultState();
bakeFXSprites();
var items=[];
items.push(['acorn', bakeMatSprite('acorn',110)]);
items.push(['star', bakeMatSprite('star',110)]);
Object.keys(MAT).forEach(function(m){ items.push([MAT[m].n, bakeMatSprite(m,110)]); });
Object.keys(ABIL).forEach(function(a){ for(var t=0;t<3;t++) items.push([ABIL[a].names[t], bakeAbilSprite(a,t,110)]); });
['slash_sword','ring','spark','puff','dust','leaf','ice','bomb','flame'].forEach(function(k){ items.push(['fx:'+k, SPR.fx[k]]); });
var COL=8, CELL=130, rows=Math.ceil(items.length/COL);
var cv=nc(COL*CELL, rows*CELL); var g=cv.getContext('2d');
g.fillStyle='#5C7A8C'; g.fillRect(0,0,cv.width,cv.height);
for(var i=0;i<items.length;i++){
  var x=(i%COL)*CELL, y=Math.floor(i/COL)*CELL;
  g.fillStyle=(i%2)?'#6E8B9C':'#64818F'; g.fillRect(x+2,y+2,CELL-4,CELL-4);
  var im=items[i][1];
  g.drawImage(im, x+(CELL-100)/2, y+4, 100,100);
  g.fillStyle='#fff'; g.font='12px sans-serif'; g.textAlign='center';
  g.fillText(items[i][0], x+CELL/2, y+CELL-6);
}
document.body.innerHTML=''; document.body.style.cssText='margin:0;background:#333';
cv.style.cssText='display:block;width:'+cv.width+'px'; document.body.appendChild(cv); window.__ready=true;
