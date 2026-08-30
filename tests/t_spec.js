const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, S=T.SPECIES, out=[];
    for(const k in S){ const s=S[k];
      out.push({k, n:s.name||s.n||'', rank:s.rank|0, boss:!!s.boss,
        a:(s.art||{}),
        }); }
    return {list:out, biomes:(T.BIOME||[]).map(b=>b.n)};
  });
  require('fs').writeFileSync('/tmp/species.json', JSON.stringify(r));
  console.log(r.list.length,'종 /',r.biomes.length,'지역');
  console.log(JSON.stringify(r.list.slice(0,3)));
  await b.close();
})();
