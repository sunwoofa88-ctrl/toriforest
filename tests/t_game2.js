const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI,S=T.S;T.S.lv=50;T.beginPlay();
   const w={}; for(const id of T.EQ_IDS){const E=T.EQUIP[id]; if(!E)continue;
     if(E.slot===1){const t=T.ARM_TYPE[E.tn]; if(t&&t.id==='plate'&&!w.a)w.a=id;}
     if(E.slot===0){const t=T.WEP_TYPE[E.tn]; if(t&&t.id==='sword'&&!w.w)w.w=id;}}
   T.giveEquip(w.a); T.giveEquip(w.w);
   S.eqOn=w; S.eqA=w.a; S.eqW=w.w; T.refreshHeroArt();});
 await p.waitForTimeout(800);
 /* 인게임에서 실제로 그려지는 주인공을 4자세로 뽑는다 */
 const u=await p.evaluate(async()=>{
   const T=window.__TORI, P=T.P;
   const px=260, o=document.createElement('canvas'); o.width=px*4; o.height=px+22;
   const g=o.getContext('2d'); g.fillStyle='#7FA86A'; g.fillRect(0,0,o.width,o.height);
   const cv=document.querySelector('canvas');
   const names=['대기(오른쪽)','대기(왼쪽)','공격','이동'];
   const setup=[()=>{P.facing=1;},()=>{P.facing=-1;},()=>{P.facing=1;T.doAttack();},()=>{P.facing=1;P.vx=1;}];
   for(let i=0;i<4;i++){
     setup[i]();
     await new Promise(r=>setTimeout(r, i===2?70:140));
     T.render&&T.render();
     const D=T.dpr||1;
     const cx=Math.round((P.x-T.cam.x)*D), cy=Math.round((P.y-T.cam.y)*D);
     g.drawImage(cv, cx-130*D, cy-200*D, 260*D, 260*D, i*px, 22, px, px);
     g.fillStyle='#063'; g.font='bold 14px sans-serif'; g.fillText(names[i], i*px+8, 16);
   }
   P.vx=0;
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/game2.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
