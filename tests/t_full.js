const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=55;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   const want={}; for(const id of T.EQ_IDS){const E=T.EQUIP[id]; if(!E)continue; if(want[E.slot]===undefined)want[E.slot]=id;}
   for(const sl in want) T.giveEquip(want[sl]);
   const map={0:'w',1:'a',2:'h',3:'c',4:'g',5:'b',6:'r1',7:'n'};
   const on={}; for(const sl in want){const k=map[sl]; if(k)on[k]=want[sl];}
   on.r2=want[6];
   S.eqOn=on; S.eqW=on.w; S.eqA=on.a; T.refreshHeroArt();
   const px=420;
   const o=document.createElement('canvas'); o.width=px*2; o.height=px;
   const g=o.getContext('2d'); g.fillStyle='#8FB870'; g.fillRect(0,0,px*2,px);
   g.imageSmoothingQuality='high';
   g.drawImage(T.SPR.hero.idle,0,0,px,px);           // 인게임 스프라이트
   const d=T.dbg.heroDoll();
   g.drawImage(d,px,0,px,px);                        // 착용화면 인형
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/full.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('left=인게임 스프라이트  right=착용화면 인형');
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
