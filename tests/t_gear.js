const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  const eq=await p.evaluate(()=>{const T=window.__TORI;
    T.S.eq=T.S.eq||{};
    const pick={};
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(pick[e.slot]) continue; if(e.grade>=3){ pick[e.slot]=k; T.S.eq[k]=1; } }
    const sl=['w','a','h','c','g','b','r1','r2','n'];
    const done=[]; let i=0;
    for(const t in pick){ if(sl[i]){ T.eqSet(sl[i], pick[t]); done.push(sl[i]+'='+T.EQUIP[pick[t]].n); } i++; }
    return done;
  });
  console.log(eq.join(' | '));
  await p.waitForTimeout(700);
  await p.evaluate(()=>window.__TORI.openSheet('gear'));
  await p.waitForTimeout(800);
  await p.screenshot({path:'/tmp/sheet_gear.png'});
  const el=await p.$('.gv-stage');
  if(el) await el.screenshot({path:'/tmp/gv_stage.png'});
  await b.close(); console.log('ok');
})();
