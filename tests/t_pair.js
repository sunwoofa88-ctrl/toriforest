const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:600,height:400},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>window.__TORI.beginPlay()); await p.waitForTimeout(1000);
 const o=await p.evaluate(()=>{
   const T=window.__TORI,D=T.dbg,res={};
   for(const k of ['frost_4','swamp_0','meadow_8','desert_6']){
     const a=D.SPECIES[k].art||{};
     const mc=D.ensureMob(k);
     const c=document.createElement('canvas'); c.width=mc.n.width;c.height=mc.n.height;
     c.getContext('2d').drawImage(mc.n,0,0);
     res[k]={img:c.toDataURL('image/png'), arch:a.arch, sig:a.sig,
             w:+(a.w||0).toFixed(3), h:+(a.h||0).toFixed(3), shape:a.shape};
   }
   return res;
 });
 for(const k in o){ fs.writeFileSync('/tmp/'+k+'.png',Buffer.from(o[k].img.split(',')[1],'base64'));
   console.log(k, o[k].arch, o[k].sig, 'w='+o[k].w, 'h='+o[k].h, 'shape='+o[k].shape); }
 await b.close();
})();
