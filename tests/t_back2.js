const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
  await p.waitForTimeout(2000);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI, out=[];
    // 조이스틱 입력을 흉내 : 위로
    for(const [nm,ix,iy] of [['up',0,-1],['down',0,1]]){
      for(let i=0;i<40;i++){
        if(T.setStick) T.setStick(ix,iy);
        else { T.P.vx=ix*300; T.P.vy=iy*300; }
        await new Promise(r2=>setTimeout(r2,16));
      }
      out.push({nm, fy:+(T.P.fy||0).toFixed(2), moving:!!T.P.moving,
                back: !!(T.heroBackSprite && T.heroBackSprite())});
    }
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
