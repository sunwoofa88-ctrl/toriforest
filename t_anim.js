/* 애니메이션이 실제로 움직이는지 : 프레임마다 스케일·기울기가 변하는지 측정 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:960,height:600},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
 await p.waitForTimeout(2200);
 await p.evaluate(()=>{const T=window.__TORI;for(let i=0;i<10;i++)T.spawnEnemy();});
 await p.waitForTimeout(600);
 const r=await p.evaluate(()=>new Promise(res=>{
   const T=window.__TORI;
   const samp=[];
   const iv=setInterval(()=>{
     const e=T.EN.find(x=>x.alive&&!x.dead);
     if(e) samp.push([+(e.aSX||1).toFixed(3), +(e.aSY||1).toFixed(3), +(e.aRot||0).toFixed(3), +(e.aOY||0).toFixed(2)]);
   },33);
   setTimeout(()=>{clearInterval(iv);
     const sx=samp.map(s=>s[0]), sy=samp.map(s=>s[1]), ro=samp.map(s=>s[2]), oy=samp.map(s=>s[3]);
     const rng=a=>+(Math.max(...a)-Math.min(...a)).toFixed(3);
     res({n:samp.length, sxRange:rng(sx), syRange:rng(sy), rotRange:rng(ro), oyRange:rng(oy),
          sample:samp.slice(0,6)});
   },3500);
 }));
 console.log('표본 '+r.n+'개');
 console.log('가로 스케일 변화폭 '+r.sxRange+'   세로 '+r.syRange);
 console.log('기울기 변화폭     '+r.rotRange+'   위아래 튐 '+r.oyRange+'px');
 console.log('예시:', JSON.stringify(r.sample));
 const alive = r.sxRange>0.02 && r.syRange>0.02;
 console.log(alive? '✅ 살아 움직인다' : '❌ 정지 상태');
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
