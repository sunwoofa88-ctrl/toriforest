const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S; const want={};
   for(const id of T.EQ_IDS){const E=T.EQUIP[id]; if(!E)continue; if(want[E.slot]===undefined)want[E.slot]=id;}
   for(const sl in want) T.giveEquip(want[sl]);
   const map={0:'w',1:'a',2:'h',3:'c',4:'g',5:'b',6:'r1',7:'n'};
   const on={}; for(const sl in want){const k=map[sl]; if(k)on[k]=want[sl];}
   Object.assign(S.eq||(S.eq={}),on); S.eqW=on.w; S.eqA=on.a; T.refreshHeroArt();
   const o=document.createElement('canvas'); o.width=760; o.height=380;
   const g=o.getContext('2d'); g.fillStyle='#8FB870'; g.fillRect(0,0,760,380);
   g.imageSmoothingQuality='high';
   g.drawImage(T.SPR.hero.idle, 10,10,360,360);       // 장비 착용
   S.eq={}; S.eqW=null; S.eqA=null; T.refreshHeroArt();
   g.drawImage(T.SPR.hero.idle, 390,10,360,360);      // 맨몸
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/gear2.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('left=착용 right=맨몸');
 await b.close();
})();
