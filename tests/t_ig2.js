const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2.6});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(2500);
  // 무기 3종을 갈아 끼우며 인게임 캡처
  const wants=['great','staff','bow'];
  const fs=require('fs');
  for(let i=0;i<wants.length;i++){
    await p.evaluate((wid)=>{
      const T=window.__TORI; let tn=-1;
      T.WEP_TYPE.forEach((w,k)=>{ if(w.id===wid) tn=k; });
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } }
    }, wants[i]);
    await p.waitForTimeout(700);
    const el=await p.$('canvas');
    await el.screenshot({path:'/tmp/ig_'+wants[i]+'.png'});
  }
  console.log('ok');
  await b.close();
})();
