const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2.6});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();
    let tn=-1; T.WEP_TYPE.forEach((w,k)=>{ if(w.id==='great') tn=k; });
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } }
    // 어두운 갑옷 장착
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot!==1) continue;
      if(T.__armCls(e)==='dark'){ T.S.eq[k]=1; T.eqSet('a',k); break; } }
    T.refreshHeroArt();
  });
  await p.waitForTimeout(2000);
  await p.evaluate(()=>{ const T=window.__TORI; if(T.enterChapter) T.enterChapter(6); });
  await p.waitForTimeout(3000);
  await p.screenshot({path:'/tmp/ag1.png'});
  await p.evaluate(()=>{ window.__TORI.openSheet('gear'); });
  await p.waitForTimeout(1200);
  await p.screenshot({path:'/tmp/ag2.png'});
  console.log('ok');
  await b.close();
})();
