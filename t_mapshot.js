const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1200,height:760},deviceScaleFactor:1.5});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
await p.waitForTimeout(600);
await p.evaluate(()=>{
  const T=window.__TORI;
  const chaps=[0,1,2,3,4,5,6,7,12,25,44,67,88,103];
  const cv=document.createElement('canvas'); cv.width=1200; cv.height=760;
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#20180F';
  document.body.appendChild(cv); const g=cv.getContext('2d');
  g.font='bold 15px sans-serif'; g.textAlign='center';
  chaps.forEach((c,i)=>{
    T.enterChapter(c);
    const col=i%5, row=(i/5)|0;
    const w=222, h=174;
    const x=col*236+10, y=row*246+8;
    g.drawImage(T.WD.ground, 0,0,T.WD.ground.width,T.WD.ground.height, x,y,w,h);
    g.lineWidth=3; g.strokeStyle='#FFE9A6'; g.strokeRect(x,y,w,h);
    // 랜드마크 점
    const sx=w/1840, sy=h/1440;
    const dot=(px,py,col2,r)=>{g.beginPath();g.arc(x+px*sx,y+py*sy,r,0,6.3);g.fillStyle=col2;g.fill();
      g.lineWidth=1.5;g.strokeStyle='#201810';g.stroke();};
    dot(T.WD.spawn.x,T.WD.spawn.y,'#FFFFFF',5);
    T.WD.camps.forEach(q=>dot(q.x,q.y,'#FF6B6B',4));
    T.WD.chests.forEach(q=>dot(q.x,q.y,'#FFD34E',4));
    dot(T.WD.arena.x,T.WD.arena.y,'#B77BFF',6);
    dot(T.WD.exitGate.x,T.WD.exitGate.y,'#6FCF63',5);
    g.fillStyle='#FFE9A6';
    g.fillText((c+1)+'장  지형'+T.chapTerrain(c)+' 배치'+T.chapLayout(c), x+w/2, y+h+18);
  });
});
await p.waitForTimeout(600);
await p.screenshot({path:'MAPS.png'});
await b.close();})();
