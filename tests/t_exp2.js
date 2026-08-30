const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:600},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{window.__TORI.beginPlay();});
 await p.waitForTimeout(1200);
 const out=await p.evaluate(()=>{
   const T=window.__TORI,D=T.dbg,res={};
   const ks=Object.keys(D.SPECIES);
   /* 골고루 24종 */
   for(let i=0;i<24;i++){
     const k=ks[Math.floor(i*ks.length/24)];
     let mc=null; try{mc=D.ensureMob(k);}catch(e){}
     if(!mc||!mc.n) continue;
     const c=document.createElement('canvas'); c.width=mc.n.width;c.height=mc.n.height;
     c.getContext('2d').drawImage(mc.n,0,0);
     res[k]={img:c.toDataURL('image/png'), sig:(D.SPECIES[k].art||{}).sig, arch:(D.SPECIES[k].art||{}).arch};
   }
   return res;
 });
 let n=0;
 for(const k in out){ fs.writeFileSync('/root/concept/art3/'+k+'.png', Buffer.from(out[k].img.split(',')[1],'base64')); n++; }
 console.log('내보냄 '+n+'종');
 await b.close();
})();
