const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   for(const id of T.EQ_IDS) T.giveEquip(id);
   /* 원소가 다른 세트를 6가지 만든다 */
   const bySlotElem={};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E)continue;
     (bySlotElem[E.slot]=bySlotElem[E.slot]||{});
     (bySlotElem[E.slot][E.en]=bySlotElem[E.slot][E.en]||[]).push(id); }
   const elems=Object.keys(bySlotElem[1]||{}).slice(0,6);
   const map={0:'w',1:'a',2:'h',3:'c',4:'g',5:'b',6:'r1',7:'n'};
   const N=elems.length, px=300, PADT=26, PADB=34;
   const o=document.createElement('canvas'); o.width=px*N; o.height=px+PADT+PADB;
   const g=o.getContext('2d'); g.fillStyle='#7FA86A'; g.fillRect(0,0,o.width,o.height);
   g.imageSmoothingQuality='high';
   const names=[];
   elems.forEach(function(en,i){
     const on={};
     for(const sl in map){ const lst=(bySlotElem[sl]||{})[en]; if(lst&&lst.length) on[map[sl]]=lst[Math.min(lst.length-1,3)]; }
     S.eqOn=on; S.eqW=on.w; S.eqA=on.a;
     /* 강화도 걸어 본다 */
     if(!S.eqUp) S.eqUp={};
     for(const k in on) S.eqUp[on[k]]=(i*3)|0;
     T.refreshHeroArt();
     g.drawImage(T.SPR.hero.idle, i*px, PADT, px, px);
     names.push((T.ELEM&&T.ELEM[en]?T.ELEM[en].n:en));
   });
   S.eqOn={}; S.eqW=null; S.eqA=null; T.refreshHeroArt();
   return {url:o.toDataURL('image/png'), names};
 });
 require('fs').writeFileSync('/tmp/showcase.png',Buffer.from(u.url.split(',')[1],'base64'));
 console.log(u.names.join(' | '));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
