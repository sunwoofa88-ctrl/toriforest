const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S; const bySlot={};
   for(const id of T.EQ_IDS){const E=T.EQUIP[id]; if(!E)continue; if(bySlot[E.slot]===undefined)bySlot[E.slot]=id;}
   for(const id of Object.values(bySlot)) T.giveEquip(id);
   const map={0:'w',1:'a',2:'h',3:'c',4:'g',5:'b',6:'r1',7:'n'};
   const on={}; for(const sl in bySlot){const k=map[sl]; if(k)on[k]=bySlot[sl];}
   Object.assign(S.eq||(S.eq={}),on); S.eqW=on.w; S.eqA=on.a; T.refreshHeroArt();
   const c=T.dbg.heroDoll();
   const o=document.createElement('canvas'); o.width=o.height=448;
   const g=o.getContext('2d'); g.fillStyle='#F2894A'; g.fillRect(0,0,448,448); g.drawImage(c,0,0);
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/doll.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('ok');
 await b.close();
})();
