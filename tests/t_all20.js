/* 전수점검 : 무기 20종 전부 손에 쥔 모습을 확인한다 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1100,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   for(const id of T.EQ_IDS) T.giveEquip(id);
   const types=T.WEP_TYPE.map(w=>w.id);
   const pick={};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E||E.slot!==0) continue;
     const t=T.WEP_TYPE[E.tn]; if(t && !pick[t.id]) pick[t.id]=id; }
   const list=types.filter(t=>pick[t]);
   const COLS=5, px=250;
   const rows=Math.ceil(list.length/COLS);
   const o=document.createElement('canvas'); o.width=px*COLS; o.height=(px+22)*rows;
   const g=o.getContext('2d'); g.fillStyle='#7FA86A'; g.fillRect(0,0,o.width,o.height);
   g.imageSmoothingQuality='high';
   list.forEach(function(t,i){
     const r=Math.floor(i/COLS), c=i%COLS;
     S.eqOn={w:pick[t]}; S.eqW=pick[t]; S.eqA=null;
     T.refreshHeroArt();
     g.drawImage(T.dbg.heroDoll(), c*px, r*(px+22)+22, px, px);
     g.fillStyle='#153'; g.font='bold 17px sans-serif';
     g.fillText(t, c*px+8, r*(px+22)+17);
   });
   S.eqOn={}; S.eqW=null; T.refreshHeroArt();
   return {url:o.toDataURL('image/png'), n:list.length};
 });
 require('fs').writeFileSync('/tmp/all20.png',Buffer.from(u.url.split(',')[1],'base64'));
 console.log('무기 종류', u.n);
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
