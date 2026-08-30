const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const b64=await p.evaluate(async()=>{
    const T=window.__TORI;
    T.S.eq=T.S.eq||{};
    for(const k in T.EQUIP){const e=T.EQUIP[k];
      if(e.slot===0 && T.WEP_TYPE[e.tn] && T.WEP_TYPE[e.tn].id==='great'){T.S.eq[k]=1;T.eqSet('w',k);break;}}
    await new Promise(r=>setTimeout(r,80));
    const src=T.heroDollCanvas();
    // 손 부위만 4배 확대
    const N=760, C=document.createElement('canvas'); C.width=N*2; C.height=N;
    const g=C.getContext('2d'); g.fillStyle='#EDE3D0'; g.fillRect(0,0,C.width,C.height);
    g.imageSmoothingEnabled=false;
    // 전체
    g.drawImage(src, 0,0, N,N);
    // 손 부위 확대 : 인형에서 주먹은 대략 (0.33,0.47) 근처
    const S=src.width;
    const sx=Math.round(S*0.20), sy=Math.round(S*0.34), sw=Math.round(S*0.30);
    g.drawImage(src, sx,sy,sw,sw, N,0, N,N);
    g.strokeStyle='#E03'; g.lineWidth=3; g.strokeRect(sx/S*N, sy/S*N, sw/S*N, sw/S*N);
    g.fillStyle='#222'; g.font='bold 22px sans-serif';
    g.fillText('전체', 10, 28); g.fillText('손 부위 확대', N+10, 28);
    return C.toDataURL('image/png').split(',')[1];
  });
  require('fs').writeFileSync('/tmp/zoomhand.png', Buffer.from(b64,'base64'));
  await b.close(); console.log('ok');
})();
