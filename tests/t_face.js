const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
  await p.waitForTimeout(1800);
  // 오른쪽/왼쪽 이동 시 facing 값과 실제 그림 반전 확인
  const r=await p.evaluate(async()=>{
    const T=window.__TORI, out=[];
    for(const vx of [400,-400]){
      T.P.vx=vx; T.P.vy=0; T.P.moving=1;
      await new Promise(r2=>setTimeout(r2,400));
      out.push({vx, facing:T.P.facing});
    }
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
