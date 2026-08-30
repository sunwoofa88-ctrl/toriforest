const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
 await p.waitForTimeout(900);
 const r=await p.evaluate(()=>{
   const T=window.__TORI;
   const bySlot={}; const types={};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue;
     bySlot[E.slot]=(bySlot[E.slot]||0)+1;
     const tn = E.slot===0? T.WEP_TYPE[E.tn] : T.ARM_TYPE[E.tn];
     if(tn) types[E.slot+'/'+tn.id]=1;
   }
   /* 장비 교체 1회에 드는 시간 = 주인공 6장 다시 굽기 */
   for(const id of T.EQ_IDS.slice(0,40)) T.giveEquip(id);
   const arm=T.EQ_ARM.filter(id=>T.EQUIP[id].slot===1).slice(0,20);
   const t0=performance.now();
   let n=0;
   for(const id of arm){ T.S.eqA=id; T.refreshHeroArt(); n++; }
   const dt=(performance.now()-t0)/Math.max(1,n);
   T.S.eqA=null; T.refreshHeroArt();
   return {total:T.EQ_IDS.length, bySlot, nTypes:Object.keys(types).length, perSwap:+dt.toFixed(1), n};
 });
 console.log(JSON.stringify(r,null,1));
 await b.close();
})();
