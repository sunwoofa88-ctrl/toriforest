/* 공격 모션 전수조사 : 4가지 모션 × 5시점 */
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
 const u=await p.evaluate(async()=>{
   const T=window.__TORI, P=T.P;
   const px=190, N=5, M=4, HDR=20;
   const o=document.createElement('canvas'); o.width=px*N; o.height=(px+HDR)*M;
   const g=o.getContext('2d'); g.fillStyle='#7FA86A'; g.fillRect(0,0,o.width,o.height);
   const cv=document.querySelector('canvas'), D=T.dpr||1;
   const names=['0 가로베기','1 회전','2 찌르기','3 내리찍기'];
   for(let m=0;m<M;m++){
     for(let f=0;f<N;f++){
       const k=f/(N-1);                 /* 0 → 1 진행도 */
       P.facing=1; P.castS=m;
       P.atkT0=0.30; P.atkT=0.30*(1-k)+0.0001;
       T.render&&T.render();
       await new Promise(r=>setTimeout(r,16));
       const cx=Math.round((P.x-T.cam.x)*D), cy=Math.round((P.y-T.cam.y)*D);
       g.drawImage(cv, cx-95*D, cy-150*D, 190*D, 190*D, f*px, m*(px+HDR)+HDR, px, px);
     }
     g.fillStyle='#063'; g.font='bold 14px sans-serif'; g.fillText(names[m], 6, m*(px+HDR)+15);
   }
   P.castS=-1; P.atkT=0;
   return o.toDataURL('image/png');
 });
 require('fs').writeFileSync('/tmp/motion.png',Buffer.from(u.split(',')[1],'base64'));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
