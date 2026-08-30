/* 원본 몸 vs 얹은 손 : 정확히 어디가 어긋났는지 픽셀로 낸다 */
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
    function mask(){ const d=g.getImageData(0,0,BIG,BIG).data; const m=new Uint8Array(BIG*BIG);
      let x0=1e9,y0=1e9,x1=-1,y1=-1,n=0;
      for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++) if(d[(y*BIG+x)*4+3]>50){ m[y*BIG+x]=1;n++;
        if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
      return {m,x0,y0,x1,y1,n}; }
    g.drawImage(T.SPR.hero.idle, ox-sz*0.5, oy-sz*BF, sz, sz);
    const body=mask();
    const F=T.heroHand();
    const fx=ox+sz*F[0], fy=oy+sz*F[1];
    g.clearRect(0,0,BIG,BIG);
    T.drawHandOver(g, fx, fy, sz, -1.5708);
    const hand=mask();
    // 손 픽셀 중 몸 밖으로 나간 비율, 그리고 손의 오른쪽 끝이 몸 안인지
    let out=0, inb=0;
    for(let i=0;i<BIG*BIG;i++) if(hand.m[i]){ if(body.m[i]) inb++; else out++; }
    // 손 오른쪽 가장자리 열에서 몸과 겹치는 픽셀 수
    let rightIn=0, rightAll=0;
    for(let y=0;y<BIG;y++){ for(let x=hand.x1-3;x<=hand.x1;x++){ const i=y*BIG+x;
      if(hand.m[i]){ rightAll++; if(body.m[i]) rightIn++; } } }
    return {sz, F, fx:+fx.toFixed(1), fy:+fy.toFixed(1),
      body:{x0:body.x0,y0:body.y0,x1:body.x1,y1:body.y1},
      hand:{x0:hand.x0,y0:hand.y0,x1:hand.x1,y1:hand.y1,n:hand.n},
      손밖:out, 몸안:inb, '손밖%':+(out/hand.n*100).toFixed(1),
      '손목끝이몸안%':rightAll? +(rightIn/rightAll*100).toFixed(1):0 };
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
