const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  async function fps(label){
    await p.waitForTimeout(600);
    const r=await p.evaluate(()=>new Promise(res=>{let n=0,last=performance.now(),t0=last;
      function f(t){ last=t; n++; if(t-t0<3000) requestAnimationFrame(f); else res(n/((t-t0)/1000)); }
      requestAnimationFrame(f);}));
    console.log(label.padEnd(28)+r.toFixed(1)+' fps');
    return r;
  }
  // 전투 상태 만들기
  await p.evaluate(()=>{const T=window.__TORI,k=T.WD.camps[0].mob;for(let i=0;i<10;i++)T.spawnEnemy(k);});
  const a=await fps('현재 (스킬바 전체)');
  await p.evaluate(()=>{ document.querySelectorAll('.skbtn').forEach(b=>b.classList.remove('tile')); });
  const c=await fps('블렌드/비네트 끔');
  await p.evaluate(()=>{ document.querySelector('.dock').style.display='none'; });
  const d=await fps('조작부 전체 숨김');
  console.log('\n스킬바 타일 효과 비용 : '+(c-a).toFixed(1)+' fps');
  console.log('조작부 전체 비용      : '+(d-a).toFixed(1)+' fps');
  await b.close();
})();
