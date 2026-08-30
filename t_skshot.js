const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  // 스킬 레벨을 다르게 줘서 등급 테두리 3종을 한 화면에 보이게
  await p.evaluate(()=>{const T=window.__TORI; const ids=T.curSkills?T.curSkills():null;
    T.S.skLv=T.S.skLv||{};
    const c=T.__skids||[];
  });
  await p.evaluate(()=>{ const T=window.__TORI;
    T.S.skLv={}; const w=T.eqAt?T.eqAt('w'):null;
    // 스킬 id 규칙 : sk_<무기타입>_<슬롯>
    for(const k in T.ABIL){ if(/^sk_/.test(k)){ const n=+k.slice(-1); T.S.skLv[k]= n<2?3 : (n<4?12:24); } }
  });
  // 쿨다운을 몇 개만 돌려 놓는다
  await p.evaluate(()=>{ const T=window.__TORI;
    T.doAttack(T.P.x+150,T.P.y, T.curSkills()[1]);
    T.doAttack(T.P.x+150,T.P.y, T.curSkills()[3]);
    T.doAttack(T.P.x+150,T.P.y, T.curSkills()[5]);
  });
  await p.waitForTimeout(700);
  const el=await p.$('.dock');
  await el.screenshot({path:'/tmp/dock.png'});
  await p.screenshot({path:'/tmp/full.png'});
  await b.close();
  console.log('저장 완료');
})();
