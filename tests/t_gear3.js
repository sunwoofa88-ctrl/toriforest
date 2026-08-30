const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   /* 갑옷 타입 4종(vest·plate·robe·scale) 을 하나씩 입혀 본다 + 강화 15 */
   const want=['vest','plate','robe','scale'];
   const pick=[]; const seenCol={};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id];
     if(!E||E.slot!==1) continue;
     const t=T.ARM_TYPE[E.tn]; if(!t) continue;
     const i=want.indexOf(t.id); if(i<0) continue;
     if(pick[i]) continue;
     if(seenCol[E.col]) continue;         /* 원소색이 겹치지 않게 */
     pick[i]=id; seenCol[E.col]=1; }
   const N=pick.length;
   const px=300, o=document.createElement('canvas'); o.width=px*(N+1); o.height=px;
   const g=o.getContext('2d'); g.fillStyle='#8FB870'; g.fillRect(0,0,o.width,px);
   S.eqOn={}; S.eqA=null; S.eqW=null; T.refreshHeroArt();
   g.drawImage(T.SPR.hero.idle, 0,0,px,px);
   pick.forEach(function(id,i){
     T.giveEquip(id); S.eqOn={a:id}; S.eqA=id;
     T.refreshHeroArt();
     g.drawImage(T.SPR.hero.idle,(i+1)*px,0,px,px);
   });
   S.eqOn={}; S.eqA=null; T.refreshHeroArt();
   return {url:o.toDataURL('image/png'), types:pick.map(id=>T.ARM_TYPE[T.EQUIP[id].tn].id)};
 });
 require('fs').writeFileSync('/tmp/gearL.png',Buffer.from(u.url.split(',')[1],'base64'));
 console.log('맨몸 | '+u.types.join(' | '));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
