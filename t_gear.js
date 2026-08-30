const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 for(const q of [{n:'A9+가로',w:1280,h:800,d:1.5},{n:'폰세로',w:390,h:844,d:2}]){
  const p=await b.newPage({viewport:{width:q.w,height:q.h},deviceScaleFactor:q.d,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
  await p.evaluate(()=>{ const T=window.__TORI; T.S.lv=60;
    Object.keys(T.EQUIP).slice(0,80).forEach(k=>{ T.S.own=T.S.own||{}; });
    T.beginPlay(); });
  await p.waitForTimeout(1200);
  await p.evaluate(()=>window.__TORI.openSheet('gear'));
  await p.waitForTimeout(900);
  await p.screenshot({path:'/root/toriforest/gear_'+q.n+'.png'});
  const r=await p.evaluate(()=>{
    const W=innerWidth,H=innerHeight,bad=[];
    document.querySelectorAll('.slotc,.doll-por,.ds,.filt-chip').forEach(e=>{
      const r=e.getBoundingClientRect(); if(r.width<2) return;
      if(r.left<-1||r.right>W+1) bad.push((e.className||'')+' '+[r.left|0,r.right|0]);
    });
    return {bad:bad.slice(0,3), slots:document.querySelectorAll('.slotc').length};
  });
  console.log(q.n+' : 슬롯'+r.slots+' 밖으로'+r.bad.length+' '+(r.bad[0]||'')+' 오류'+errs.length);
  await p.close();
 }
 await b.close();
})();
