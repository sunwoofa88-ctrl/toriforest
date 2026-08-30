const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();
    let tn=-1; T.WEP_TYPE.forEach((w,k)=>{ if(w.id==='great') tn=k; });
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } }});
  await p.waitForTimeout(1500);
  // 몬스터 있는 장으로
  await p.evaluate(()=>{ const T=window.__TORI; if(T.enterChapter) T.enterChapter(3); });
  await p.waitForTimeout(3500);
  await p.screenshot({path:'/tmp/fin1.png'});
  // 상태창
  await p.evaluate(()=>{ const T=window.__TORI; T.openSheet('gear'); });
  await p.waitForTimeout(1200);
  await p.screenshot({path:'/tmp/fin2.png'});
  console.log('ok');
  await b.close();
})();
