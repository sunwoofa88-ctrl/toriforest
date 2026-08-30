/* 전수조사 : 갑옷 6계열 × 무기 6종 = 36 조합 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1100,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=80;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   for(const id of T.EQ_IDS) T.giveEquip(id);
   const arm=['vest','plate','robe','scale','royal','spike'];
   const wep=['sword','hammer','bow','staff','great','wand'];
   const A={},W={};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue;
     if(E.slot===1){const t=T.ARM_TYPE[E.tn]; if(t&&arm.indexOf(t.id)>=0&&!A[t.id])A[t.id]=id;}
     if(E.slot===0){const t=T.WEP_TYPE[E.tn]; if(t&&wep.indexOf(t.id)>=0&&!W[t.id])W[t.id]=id;} }
   const px=200, HDR=20;
   const o=document.createElement('canvas');
   o.width=px*wep.length; o.height=(px+HDR)*arm.length;
   const g=o.getContext('2d'); g.fillStyle='#7FA86A'; g.fillRect(0,0,o.width,o.height);
   g.imageSmoothingQuality='high';
   arm.forEach(function(a,r){
     wep.forEach(function(w,c){
       S.eqOn={a:A[a], w:W[w]}; S.eqA=A[a]; S.eqW=W[w];
       T.refreshHeroArt();
       g.drawImage(T.dbg.heroDoll(), c*px, r*(px+HDR)+HDR, px, px);
       g.fillStyle='#0a3'; g.font='bold 13px sans-serif';
       g.fillText(a+' + '+w, c*px+6, r*(px+HDR)+15);
     });
   });
   S.eqOn={}; S.eqA=null; S.eqW=null; T.refreshHeroArt();
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/matrix.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
