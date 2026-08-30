const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();
    let tn=-1; T.WEP_TYPE.forEach((w,k)=>{ if(w.id==='sword') tn=k; });
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } }
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot!==1) continue;
      if(T.__armCls(e)==='plate'){ T.S.eq[k]=1; T.eqSet('a',k); break; } }
    T.refreshHeroArt();
  });
  await p.waitForTimeout(2200);
  const el=await p.$('canvas');
  for(const [nm,ix,iy] of [['down',0,1],['up',0,-1],['right',1,0],['left',-1,0]]){
    // 계속 밀어 준다 : 한 번만 넣으면 다음 프레임에 0 이 된다
    await p.evaluate(async(v)=>{
      const T=window.__TORI;
      for(let i=0;i<30;i++){ T.P.vx=v[0]*320; T.P.vy=v[1]*320; T.P.moving=1;
        const l=Math.hypot(v[0],v[1]); T.P.fx=v[0]/l; T.P.fy=v[1]/l;
        if(v[0]) T.P.facing=v[0]>=0?1:-1;
        await new Promise(r=>setTimeout(r,16)); }
    }, [ix,iy]);
    await el.screenshot({path:'/tmp/dir_'+nm+'.png'});
  }
  console.log('ok');
  await b.close();
})();
