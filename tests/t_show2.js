const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   for(const id of T.EQ_IDS) T.giveEquip(id);
   /* 갑옷 계열 6종 × 무기 6종을 짝지어 보여준다 */
   const cls=['vest','plate','robe','scale','royal','spike'];
   const wep=['sword','hammer','staff','bow','great','wand'];
   const A=[],W=[];
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue;
     if(E.slot===1){ const t=T.ARM_TYPE[E.tn]; const i=t?cls.indexOf(t.id):-1; if(i>=0&&!A[i])A[i]=id; }
     if(E.slot===0){ const t=T.WEP_TYPE[E.tn]; const i=t?wep.indexOf(t.id):-1; if(i>=0&&!W[i])W[i]=id; }
   }
   const N=6, px=300, PAD=20;
   const o=document.createElement('canvas'); o.width=px*N; o.height=px+PAD*2;
   const g=o.getContext('2d'); g.fillStyle='#7FA86A'; g.fillRect(0,0,o.width,o.height);
   g.imageSmoothingQuality='high';
   const names=[];
   for(let i=0;i<N;i++){
     S.eqOn={a:A[i], w:W[i]}; S.eqA=A[i]; S.eqW=W[i];
     T.refreshHeroArt();
     g.drawImage(T.dbg.heroDoll(), i*px, PAD, px, px);
     names.push((T.ARM_TYPE[T.EQUIP[A[i]].tn].id)+'+'+(T.WEP_TYPE[T.EQUIP[W[i]].tn].id));
   }
   S.eqOn={}; S.eqA=null; S.eqW=null; T.refreshHeroArt();
   return {url:o.toDataURL('image/png'), names};
 });
 require('fs').writeFileSync('/tmp/show6.png',Buffer.from(u.url.split(',')[1],'base64'));
 console.log(u.names.join(' | '));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
