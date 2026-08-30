const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.beginPlay();});
 await p.waitForTimeout(800);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   for(const id of T.EQ_IDS) T.giveEquip(id);
   const W={}; for(const id of T.EQ_IDS){const E=T.EQUIP[id]; if(!E||E.slot!==0)continue;
     const t=T.WEP_TYPE[E.tn]; if(t&&!W[t.id])W[t.id]=id;}
   const show=['bow','sword','staff'];
   const px=420, o=document.createElement('canvas'); o.width=px*show.length; o.height=px+22;
   const g=o.getContext('2d'); g.fillStyle='#EAF0E2'; g.fillRect(0,0,o.width,o.height);
   g.imageSmoothingQuality='high';
   show.forEach(function(w,i){
     S.eqOn={w:W[w]}; S.eqW=W[w]; S.eqA=null; T.refreshHeroArt();
     const H=T.dbg.hold();
     /* 인형이 아니라 스프라이트+무기를 직접 그려 좌표를 정확히 표시한다 */
     const sz=px*0.80, ox=i*px+px*0.5, oy=22+px*0.86;
     const BASE_F=112/120;
     const hi=T.SPR.hero.idle;
     const wsp=T.dbg.eqW(W[w]); const wg=T.dbg.wgrip(W[w]);
     const WS=sz*0.50*(wg.s||1);
     /* 무기를 몸보다 먼저(뒤에) → 주먹 손가락이 자루 앞에 온다 */
     g.save(); g.translate(ox+sz*H.HAND_X, oy+sz*H.HAND_Y); g.rotate(wg.rot);
     g.drawImage(wsp, -WS*wg.x, -WS*wg.y, WS, WS); g.restore();
     g.drawImage(hi, ox-sz*0.5, oy-sz*BASE_F, sz, sz);
     /* 손 앵커 = 빨간 십자 */
     const hx=ox+sz*H.HAND_X, hy=oy+sz*H.HAND_Y;
     g.strokeStyle='#F00'; g.lineWidth=3;
     g.beginPath(); g.moveTo(hx-14,hy); g.lineTo(hx+14,hy); g.moveTo(hx,hy-14); g.lineTo(hx,hy+14); g.stroke();
     g.beginPath(); g.arc(hx,hy,10,0,6.28); g.stroke();
     g.fillStyle='#063'; g.font='bold 15px sans-serif'; g.fillText(w+'  HAND('+H.HAND_X+','+H.HAND_Y+')', i*px+8, 16);
   });
   S.eqOn={}; S.eqW=null; T.refreshHeroArt();
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/grip2.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('ok'); await b.close();
})();
