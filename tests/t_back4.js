const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot!==1) continue;
      if(T.__armCls(e)==='plate'){ T.S.eq[k]=1; T.eqSet('a',k); break; } }
    T.refreshHeroArt();});
  await p.waitForTimeout(2000);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI, out=[];
    for(const [nm,ix,iy] of [['up',0,-1],['down',0,1],['right',1,0]]){
      window.__BACKHIT=0;
      for(let i=0;i<40;i++){ T.P.vx=ix*320; T.P.vy=iy*320; T.P.moving=1;
        const l=Math.hypot(ix,iy); T.P.fx=ix/l; T.P.fy=iy/l;
        await new Promise(r2=>setTimeout(r2,16)); }
      out.push({nm, backFrames: window.__BACKHIT|0, fy:+T.P.fy.toFixed(2)});
    }
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
