const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  console.log(JSON.stringify(await p.evaluate(()=>{
    const T=window.__TORI, out=[];
    for(let i=0;i<6;i++){
      const b=document.getElementById('sk'+i);
      const cd=b.querySelector('.skcd');
      out.push({i, cdgone:cd.style.getPropertyValue('--cdgone'),
        SK_CD:+(T.SK_CD?T.SK_CD[i]:-1).toFixed(2),
        bg:getComputedStyle(cd).backgroundImage.slice(0,90),
        cls:b.className});
    }
    return {out, conic:T.SK_CONIC===undefined?'n/a':T.SK_CONIC};
  }),null,1));
  await b.close();
})();
