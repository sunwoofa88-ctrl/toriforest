const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{
    const T=window.__TORI;
    const BIG=Math.round(224*1.7), sz=176, BF=T.BASE_F;
    const ox=BIG*0.5, oy=BIG*0.5+sz*0.30;
    const hh=T.heroHand();
    const cv=document.createElement('canvas'); cv.width=BIG; cv.height=BIG;
    const g=cv.getContext('2d');
    const spr=T.SPR.hero.idle;
    const sxx=1, syy=1;
    g.drawImage(spr, ox-sz*0.5, oy-sz*BF, sz, sz);
    const d=g.getImageData(0,0,BIG,BIG).data;
    // 몸통 실루엣 bbox + 행별 좌우끝 (몸의 왼쪽 경계선을 찾는다)
    let minx=1e9,miny=1e9,maxx=-1,maxy=-1;
    const rowL=[], rowR=[];
    for(let y=0;y<BIG;y++){ let l=-1,rr=-1;
      for(let x=0;x<BIG;x++){ if(d[(y*BIG+x)*4+3]>40){ if(l<0)l=x; rr=x; } }
      rowL[y]=l; rowR[y]=rr;
      if(l>=0){ if(l<minx)minx=l; if(rr>maxx)maxx=rr; if(y<miny)miny=y; if(y>maxy)maxy=y; }
    }
    const fx=ox+sz*hh[0], fy=oy+sz*hh[1];
    return {BIG,sz,BF,ox,oy,hh,fx,fy,
      body:{minx,miny,maxx,maxy,w:maxx-minx,h:maxy-miny},
      // 주먹 높이에서의 몸 좌우끝
      atFist:{L:rowL[Math.round(fy)], R:rowR[Math.round(fy)]},
      rowL:rowL.filter((v,i)=>i%8===0), rowR:rowR.filter((v,i)=>i%8===0),
      names:T.WEP_TYPE.map(w=>w.id)};
  });
  console.log(JSON.stringify(r,null,1).slice(0,2500));
  await b.close();
})();
