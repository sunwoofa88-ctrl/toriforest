const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:600},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const r=await p.evaluate(()=>{
   const T=window.__TORI, out=[];
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E||E.slot!==0) continue;
     const t=T.WEP_TYPE[E.tn]; if(!t) continue;
     if(out.find(o=>o.t===t.id)) continue;
     const g=T.dbg.wgrip(id);
     out.push({t:t.id, key:T.dbg.artKey(id), x:+g.x.toFixed(3), y:+g.y.toFixed(3), rot:+g.rot.toFixed(2), s:g.s});
     if(out.length>=6) break; }
   return {out, HOLD:T.dbg.hold? T.dbg.hold():'?'};
 });
 console.log(JSON.stringify(r,null,1));
 await b.close();
})();
