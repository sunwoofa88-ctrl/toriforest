const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const b64=await p.evaluate(async()=>{
    const T=window.__TORI; T.S.eq=T.S.eq||{};
    for(const k in T.EQUIP){const e=T.EQUIP[k];
      if(e.slot===0 && T.WEP_TYPE[e.tn] && T.WEP_TYPE[e.tn].id==='great'){T.S.eq[k]=1;T.eqSet('w',k);break;}}
    const gfs=[0.22,0.32,0.42,0.52,0.62];
    const cans=[];
    for(const gf of gfs){
      T.W_TYPE_HOLD.great[3]=gf;
      await new Promise(r=>setTimeout(r,40));
      cans.push({gf, d:T.heroDollCanvas().toDataURL('image/png')});
    }
    T.W_TYPE_HOLD.great[3]=0.22;
    const N=340, C=document.createElement('canvas'); C.width=N*gfs.length; C.height=N+26;
    const g=C.getContext('2d'); g.fillStyle='#F0E6D2'; g.fillRect(0,0,C.width,C.height);
    for(let i=0;i<cans.length;i++){
      const im=new Image(); im.src=cans[i].d; await im.decode();
      g.drawImage(im, i*N, 0, N, N);
      g.fillStyle='#222'; g.font='bold 17px sans-serif'; g.fillText('자루위치 '+cans[i].gf.toFixed(2), i*N+8, N+18);
      g.strokeStyle='#C9B79A'; g.strokeRect(i*N+1,1,N-2,N-2);
    }
    return C.toDataURL('image/png').split(',')[1];
  });
  require('fs').writeFileSync('/tmp/gf.png', Buffer.from(b64,'base64'));
  await b.close(); console.log('ok');
})();
