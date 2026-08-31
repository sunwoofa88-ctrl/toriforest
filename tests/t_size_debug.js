const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:700},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1000);

  const info1=await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
    const spr=T.SPR.hero.idle;
    // measure non-transparent bbox of the baked idle sprite canvas
    const cx=spr.getContext('2d');
    const d=cx.getImageData(0,0,spr.width,spr.height).data;
    let minX=spr.width,maxX=0,minY=spr.height,maxY=0;
    for(let y=0;y<spr.height;y++)for(let x=0;x<spr.width;x++){
      const a=d[(y*spr.width+x)*4+3];
      if(a>10){ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
    }
    return {
      eqW:T.S.eqW, eqA:T.S.eqA, P_size:T.P.size,
      sprW:spr.width, sprH:spr.height,
      bboxX:[minX/spr.width,maxX/spr.width], bboxY:[minY/spr.height,maxY/spr.height],
      fillW:(maxX-minX)/spr.width, fillH:(maxY-minY)/spr.height
    };
  });
  console.log('BARE', JSON.stringify(info1));

  const info2=await p.evaluate(()=>{
    const T=window.__TORI;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===1){ T.S.eq[k]=1; T.eqSet('a',k); break; } }
    const spr=T.SPR.hero.idle;
    const cx=spr.getContext('2d');
    const d=cx.getImageData(0,0,spr.width,spr.height).data;
    let minX=spr.width,maxX=0,minY=spr.height,maxY=0;
    for(let y=0;y<spr.height;y++)for(let x=0;x<spr.width;x++){
      const a=d[(y*spr.width+x)*4+3];
      if(a>10){ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
    }
    return {
      eqW:T.S.eqW, eqA:T.S.eqA, P_size:T.P.size,
      sprW:spr.width, sprH:spr.height,
      bboxX:[minX/spr.width,maxX/spr.width], bboxY:[minY/spr.height,maxY/spr.height],
      fillW:(maxX-minX)/spr.width, fillH:(maxY-minY)/spr.height
    };
  });
  console.log('GEARED', JSON.stringify(info2));

  await b.close();
})();
