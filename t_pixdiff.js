/* 결정적 프레임 픽셀 대조 : 난수를 고정해 두 빌드가 완전히 같은 그림을 그리게 한다 */
const {chromium}=require('playwright');
const SEED_JS = `(function(){var s=123456789;
  Math.random=function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
})();`;
async function shot(b,file,out){
  const p=await b.newPage({viewport:{width:900,height:520},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(SEED_JS);
  await p.goto('file://'+file);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
  await p.waitForTimeout(2000);
  await p.evaluate(()=>{const T=window.__TORI;
    T.dbg.setRoam(0);
    for(const e of T.EN) e.alive=false;
    for(let i=0;i<10;i++){ const e=T.spawnEnemy();
      if(e){ e.x=T.P.x-260+i*58; e.y=T.P.y-120+(i%3)*95; e.dir=(i%2)?1:-1; } }
    for(let i=0;i<6;i++) T.dropLoot&&T.dropLoot(T.P.x-150+i*60, T.P.y+120);
    T.P.invT=0;
  });
  await p.waitForTimeout(700);
  await p.evaluate(()=>{ window.__TORI.P.invT=0; });
  await p.waitForTimeout(60);
  await p.screenshot({path:out});
  await p.close();
  return errs;
}
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const e1=await shot(b,'/root/toriforest/dotorisup.html','/root/toriforest/shots/px_now.png');
 const e2=await shot(b,'/tmp/ref.html','/root/toriforest/shots/px_ref.png');
 console.log('오류 now:',e1.length,' ref:',e2.length);
 await b.close();
})();
