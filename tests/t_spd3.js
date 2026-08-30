const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
 await p.waitForTimeout(900);
 const r=await p.evaluate(()=>{ const T=window.__TORI;
   return {sp:+T.dbg.moveSpd().toFixed(1), SC:+(T.dbg.moveSpd()/370).toFixed(4)}; });
 console.log('게임이 실제로 쓰는 이동속도  '+r.sp+' px/s  (SC·보너스 배율 '+r.SC+')');
 console.log('이전 계수 462 기준 환산      '+(462*r.SC).toFixed(1)+' px/s');
 console.log('감소율                      '+(100-370/462*100).toFixed(1)+'%');
 await b.close();
})();
