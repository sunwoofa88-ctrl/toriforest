const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2.5,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  await p.evaluate(()=>{ const T=window.__TORI;
    T.S.skLv={}; for(const k in T.ABIL){ if(/^sk_/.test(k)){ const n=+k.slice(-1); T.S.skLv[k]= n<2?3:(n<4?14:25); } }
  });
  // 절반은 쿨, 절반은 준비 상태로 보이게 고정
  await p.evaluate(()=>{ const T=window.__TORI; T.doAttack(T.P.x+150,T.P.y,T.curSkills()[1]); T.doAttack(T.P.x+150,T.P.y,T.curSkills()[4]); });
  await p.waitForTimeout(500);
  const el=await p.$('.skill-cluster');
  await el.screenshot({path:'/tmp/zoom.png'});
  await b.close(); console.log('ok');
})();
