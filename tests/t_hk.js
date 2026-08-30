const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:600}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI, res=[];
    const want={};
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot!==1) continue;
      const c=T.__armCls(e); if(c&&!want[c]) want[c]=k; }
    res.push('HAND_ART='+JSON.stringify(T.HAND_ART||null));
    res.push('artOf 확인: '+['hand_bare','hand_leather','hand_steel','hand_magic']
      .map(k=>k+'='+(T.artOf(k)?'O':'X')).join(' '));
    for(const cls in want){
      T.S.eq[want[cls]]=1; T.eqSet('a', want[cls]); T.refreshHeroArt();
      await new Promise(r2=>setTimeout(r2,80));
      res.push(cls+' → heroArmorCls='+T.__hac()+'  handKey='+T.__hkey()+'  elemCol='+T.__hcol());
    }
    return res;
  });
  console.log(r.join('\n'));
  await b.close();
})();
