const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI, S=T.S;
   /* 무기 4종을 골라 손잡이 위치를 표시하며 그린다 */
   const picks=[];
   const want=['sword','great','hammer','bow','staff','wand'];
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E||E.slot!==0) continue;
     const t=T.WEP_TYPE[E.tn]; if(!t) continue;
     const i=want.indexOf(t.id); if(i>=0&&!picks[i]) picks[i]=id; }
   const list=picks.filter(Boolean);
   const px=300, o=document.createElement('canvas');
   o.width=px*list.length; o.height=px;
   const g=o.getContext('2d'); g.fillStyle='#8FB870'; g.fillRect(0,0,o.width,px);

   list.forEach(function(id,i){
     const w=T.eqSprWorld? T.eqSprWorld(id) : null;
     const wsp = w || T.dbg.eqW(id);
     const WS=px*0.62;
     const hx=i*px+px*0.5, hy=px*0.66;
     const wg=T.dbg.wgrip(id);
     g.save(); g.translate(hx,hy); g.rotate(wg.rot);
     g.drawImage(wsp, -WS*wg.x, -WS*wg.y, WS, WS);
     g.restore();
     /* 손 위치 = 빨간 점, 여기에 손잡이가 와야 한다 */
     g.fillStyle='#FF0000'; g.beginPath(); g.arc(hx,hy,7,0,6.28); g.fill();
     g.fillStyle='#000'; g.font='bold 18px sans-serif';
     g.fillText(T.WEP_TYPE[T.EQUIP[id].tn].id, i*px+10, 26);
   });
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/wdiag.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('ok');
 await b.close();
})();
