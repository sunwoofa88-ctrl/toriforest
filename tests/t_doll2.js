const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(900);
 const u=await p.evaluate(()=>{
   const T=window.__TORI,S=T.S;
   /* 부위마다 색이 다른 장비를 골라 끼운다 — 어느 부위가 어디 그려졌는지 눈으로 확인하려고 */
   const want={0:null,1:null,2:null,3:null,4:null,5:null,6:null,7:null};
   const seen={};
   for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue;
     if(want[E.slot]===null){ want[E.slot]=id; } }
   for(const sl in want){ if(want[sl]) T.giveEquip(want[sl]); }
   const map={0:'w',1:'a',2:'h',3:'c',4:'g',5:'b',6:'r1',7:'n'};
   const on={}; for(const sl in want){ const k=map[sl]; if(k&&want[sl]) on[k]=want[sl]; }
   Object.assign(S.eq||(S.eq={}),on); S.eqW=on.w; S.eqA=on.a; T.refreshHeroArt();
   const c=T.dbg.heroDoll();
   const o=document.createElement('canvas'); o.width=o.height=448;
   const g=o.getContext('2d'); g.fillStyle='#F2894A'; g.fillRect(0,0,448,448); g.drawImage(c,0,0);
   /* 보정 격자 : sz=176, ox=110, oy=206 (2배 캔버스) */
   const sz=176*2, ox=110*2, oy=206*2;
   g.strokeStyle='rgba(255,0,0,.45)'; g.fillStyle='#900'; g.font='11px monospace';
   for(let t=0;t<=8;t++){ const y=oy-sz*t*0.1; if(y<0||y>448)continue;
     g.beginPath(); g.moveTo(0,y); g.lineTo(448,y); g.stroke(); g.fillText('-'+(t*0.1).toFixed(1),2,y-2); }
   g.strokeStyle='rgba(0,0,255,.35)'; g.fillStyle='#009';
   for(let t=-3;t<=3;t++){ const x=ox+sz*t*0.1; if(x<0||x>448)continue;
     g.beginPath(); g.moveTo(x,0); g.lineTo(x,448); g.stroke(); g.fillText((t*0.1).toFixed(1),x+2,446); }
   const names=Object.keys(on).map(k=>k+':'+T.EQUIP[on[k]].n).join(' | ');
   return {url:o.toDataURL('image/png'), names};
 });
 require('fs').writeFileSync('/tmp/doll2.png',Buffer.from(u.url.split(',')[1],'base64'));
 console.log(u.names);
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
