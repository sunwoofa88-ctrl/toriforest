const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();
    let tn=-1; T.WEP_TYPE.forEach((w,k)=>{ if(w.id==='sword') tn=k; });
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } }
    // 투구 장착
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===2){ T.S.eq[k]=1; T.eqSet('h',k); break; } }
    T.refreshHeroArt();
  });
  await p.waitForTimeout(2000);
  const el=await p.$('canvas');
  for(const [nm,vx] of [['R',400],['L',-400]]){
    await p.evaluate((v)=>{ const T=window.__TORI; T.P.vx=v; T.P.vy=0; T.P.moving=1; }, vx);
    await p.waitForTimeout(500);
    await el.screenshot({path:'/tmp/face_'+nm+'.png'});
  }
  console.log('ok');
  await b.close();
})();
