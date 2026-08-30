const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{
    const T=window.__TORI, BIG=381, sz=176, BF=T.BASE_F;
    const ox=BIG*0.5, oy=BIG*0.5+sz*0.30;
    const cv=document.createElement('canvas'); cv.width=BIG; cv.height=BIG;
    const g=cv.getContext('2d');
    function bbox(){ const d=g.getImageData(0,0,BIG,BIG).data;
      let x0=1e9,y0=1e9,x1=-1,y1=-1,n=0;
      for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++){ if(d[(y*BIG+x)*4+3]>40){n++;
        if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }
      return {x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1,n}; }
    g.drawImage(T.SPR.hero.idle, ox-sz*0.5, oy-sz*BF, sz, sz);
    const body=bbox();
    const F=T.heroHand();
    const fx=ox+sz*F[0], fy=oy+sz*F[1];
    g.clearRect(0,0,BIG,BIG);
    T.drawHandOver(g, fx, fy, sz, -1.5708);
    const hand=bbox();
    return {sz, F, fx, fy, body, hand,
            fistPx: F[2]*sz, meta:T.HAND_META['hand_bare']};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
