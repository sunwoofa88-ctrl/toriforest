const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:600},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI;
   const ids=['','a_vest_acorn','a_vest_fire','a_vest_ice','a_robe_star'].filter(id=>id===''||T.EQUIP[id]);
   const px=180, c=document.createElement('canvas'); c.width=px*ids.length; c.height=px;
   const g=c.getContext('2d'); g.fillStyle='#2b2b34'; g.fillRect(0,0,c.width,c.height);
   ids.forEach((id,i)=>{ if(id){T.giveEquip(id); T.S.eqA=id;} else T.S.eqA=null;
     T.refreshHeroArt(); g.drawImage(T.SPR.hero.idle, i*px,0,px,px); });
   T.S.eqA=null; T.refreshHeroArt();
   return c.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/heroarm.png', Buffer.from(u.split(',')[1],'base64'));
 console.log('ok');
 await b.close();
})();
