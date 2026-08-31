const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:700},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1000);

  function bboxOf(spr){
    return null; // placeholder, real logic inline below
  }

  const dump=async(label)=>{
    const r=await p.evaluate(()=>{
      const T=window.__TORI;
      const out={};
      for(const st in T.SPR.hero){
        const spr=T.SPR.hero[st];
        if(!spr||!spr.getContext) continue;
        const cx=spr.getContext('2d');
        const d=cx.getImageData(0,0,spr.width,spr.height).data;
        let minX=spr.width,maxX=0,minY=spr.height,maxY=0,any=false;
        for(let y=0;y<spr.height;y++)for(let x=0;x<spr.width;x++){
          const a=d[(y*spr.width+x)*4+3];
          if(a>10){ any=true; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
        }
        if(!any) continue;
        out[st]={bx:[+(minX/spr.width).toFixed(3),+(maxX/spr.width).toFixed(3)],
                  by:[+(minY/spr.height).toFixed(3),+(maxY/spr.height).toFixed(3)],
                  w:+((maxX-minX)/spr.width).toFixed(3), h:+((maxY-minY)/spr.height).toFixed(3)};
      }
      return out;
    });
    console.log(label, JSON.stringify(r));
  };

  await p.evaluate(()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{}; T.S.eqW=null; T.S.eqA=null;
    if(typeof T.refreshHeroArt==='function') T.refreshHeroArt();
  });
  await dump('BARE');

  await p.evaluate(()=>{
    const T=window.__TORI;
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===1){ T.S.eq[k]=1; T.eqSet('a',k); break; } }
  });
  await dump('GEARED_light');

  await b.close();
})();
