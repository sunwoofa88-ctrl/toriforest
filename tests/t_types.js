const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const r=await p.evaluate(()=>{
   const T=window.__TORI, out={};
   const SLN={0:'무기',1:'갑옷',2:'투구',3:'망토',4:'장갑',5:'신발',6:'반지',7:'목걸이'};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue;
     const tn=(E.slot===0? T.WEP_TYPE[E.tn] : T.ARM_TYPE[E.tn]);
     const k=SLN[E.slot]; (out[k]=out[k]||{})[tn?tn.id:('t'+E.tn)]=1; }
   const res={}; for(const k in out) res[k]={n:Object.keys(out[k]).length, ids:Object.keys(out[k])};
   return res;
 });
 for(const k in r) console.log(k.padEnd(5)+' 타입 '+String(r[k].n).padStart(2)+' : '+r[k].ids.join(', '));
 await b.close();
})();
