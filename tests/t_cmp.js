const {chromium}=require('playwright');
async function run(file,label){
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  await p.goto('file://'+file);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  await p.evaluate(()=>{const T=window.__TORI,k=T.WD.camps[0].mob;for(let i=0;i<10;i++)T.spawnEnemy(k);});
  const rs=[];
  for(let t=0;t<3;t++){
    await p.waitForTimeout(500);
    rs.push(await p.evaluate(()=>new Promise(res=>{let n=0,t0=performance.now();
      function f(t){ n++; if(t-t0<2500) requestAnimationFrame(f); else res(n/((t-t0)/1000)); }
      requestAnimationFrame(f);})));
  }
  await b.close();
  const avg=rs.reduce((a,c)=>a+c,0)/rs.length;
  console.log(label.padEnd(22)+avg.toFixed(1)+' fps   ('+rs.map(x=>x.toFixed(1)).join(' / ')+')');
  return avg;
}
(async()=>{
  const o=await run('/tmp/oldbuild/dotorisup.html','이전(HEAD)');
  const n=await run('/root/toriforest/dotorisup.html','지금(스킬바 개편)');
  console.log('\n차이 : '+(n-o>=0?'+':'')+(n-o).toFixed(1)+' fps');
})();
