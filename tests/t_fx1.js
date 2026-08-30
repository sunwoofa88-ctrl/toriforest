const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:800,height:1340},deviceScaleFactor:1.5});
 const errs=[]; pg.on('pageerror',e=>errs.push(String(e))); pg.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
 await pg.goto('file:///root/toriforest/dotorisup.html');
 await pg.waitForFunction(()=>window.__TORI&&window.__TORI.dbg,null,{timeout:30000});
 await pg.evaluate(()=>{ const d=__TORI.dbg; d.start&&d.start(); });
 await pg.waitForTimeout(600);
 const info=await pg.evaluate(()=>{const d=__TORI.dbg;return{keys:Object.keys(d).slice(0,60)}});
 console.log(JSON.stringify(info,null,1));
 console.log('ERRS',errs.slice(0,6));
 await b.close();
})();
