const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();
    T.S.mat=T.S.mat||{}; T.MAT_IDS.forEach(m=>T.S.mat[m]=9);});
  await p.waitForTimeout(1200);
  // 가방 열기
  await p.evaluate(()=>{ const T=window.__TORI; if(T.openSheet) T.openSheet('bag'); });
  await p.waitForTimeout(900);
  // '재료' 탭 클릭
  const tabs=await p.$$('button, .tab, [role=tab]');
  for(const t of tabs){ const tx=(await t.innerText().catch(()=>'')) || '';
    if(tx.trim()==='재료'){ await t.click(); break; } }
  await p.waitForTimeout(900);
  await p.screenshot({path:'/tmp/matui.png'});
  console.log('ok');
  await b.close();
})();
