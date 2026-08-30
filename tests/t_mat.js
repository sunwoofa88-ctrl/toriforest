const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, out=[];
    for(const id of T.MAT_IDS){ const m=T.MAT[id]; out.push({id, n:m.n, t:m.t, c:m.c, sh:m.sh}); }
    return out;
  });
  require('fs').writeFileSync('/tmp/matcol.json', JSON.stringify(r));
  console.log(r.length); console.log(JSON.stringify(r.slice(0,3)));
  await b.close();
})();
