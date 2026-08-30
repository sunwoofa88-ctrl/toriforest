const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  await p.evaluate(()=>{const T=window.__TORI; T.S.eq=T.S.eq||{};
    for(const k in T.EQUIP){const e=T.EQUIP[k];
      if(e.slot===0 && T.WEP_TYPE[e.tn] && T.WEP_TYPE[e.tn].id==='great'){T.S.eq[k]=1;T.eqSet('w',k);break;}}});
  await p.waitForTimeout(400);
  const box=await p.evaluate(()=>{
    const cv=document.querySelector('canvas'); const r=cv.getBoundingClientRect();
    return {cx:r.left+r.width/2, cy:r.top+r.height/2};
  });
  const shots=[];
  await p.evaluate(()=>{ const T=window.__TORI; T.doAttack(T.P.x+160, T.P.y); });
  for(let i=0;i<3;i++){
    await p.evaluate(()=>{ const T=window.__TORI; T.cam.x=T.P.x; T.cam.y=T.P.y; });
    await p.waitForTimeout(48);
    shots.push(await p.screenshot());
  }
  require('fs').writeFileSync('/tmp/swpos.json', JSON.stringify(box));
  shots.forEach((s,i)=>require('fs').writeFileSync('/tmp/sw'+i+'.png', s));
  await b.close(); console.log('ok');
})();
