const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(1000);
 /* 장비를 부위별로 하나씩 채운다 */
 await p.evaluate(()=>{
   const T=window.__TORI, S=T.S;
   const bySlot={};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue;
     if(bySlot[E.slot]===undefined) bySlot[E.slot]=id; }
   for(const id of Object.values(bySlot)) T.giveEquip(id);
   const map={0:'w',1:'a',2:'h',3:'c',4:'g',5:'b',6:'r1',7:'n'};
   const on={};
   for(const sl in bySlot){ const k=map[sl]; if(k) on[k]=bySlot[sl]; }
   Object.assign(S.eq||(S.eq={}), on);
   S.eqW=on.w||null; S.eqA=on.a||null;
   T.refreshHeroArt();
 });
 await p.evaluate(()=>window.__TORI.openSheet('gear'));
 await p.waitForTimeout(700);
 await p.screenshot({path:'/tmp/ui_gear.png'});
 await p.evaluate(()=>{ const T=window.__TORI; for(const k in T.SPECIES) T.S.codex[k]=1; T.openSheet('book'); });
 await p.waitForTimeout(900);
 await p.screenshot({path:'/tmp/ui_book.png'});
 console.log('오류:', errs.length?errs.slice(0,3):'없음');
 await b.close();
})();
