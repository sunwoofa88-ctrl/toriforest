const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const b64=await p.evaluate(()=>{
    const T=window.__TORI;
    const hi=T.SPR&&T.SPR.hero?T.SPR.hero.idle:null;
    const paw=T.SPR?T.SPR.heroPaw:null;
    const N=560, C=document.createElement('canvas'); C.width=N*2; C.height=N+40;
    const g=C.getContext('2d'); g.fillStyle='#F0E6D2'; g.fillRect(0,0,C.width,C.height);
    // 왼쪽 : 몸 그림 + 격자 + 손 앵커
    if(hi) g.drawImage(hi,0,0,N,N);
    if(paw) g.drawImage(paw,N,0,N,N);
    for(const off of [0,N]){
      g.strokeStyle='rgba(255,0,0,.45)'; g.lineWidth=1;
      for(let i=0;i<=10;i++){ g.beginPath(); g.moveTo(off+i*N/10,0); g.lineTo(off+i*N/10,N); g.stroke();
                              g.beginPath(); g.moveTo(off,i*N/10); g.lineTo(off+N,i*N/10); g.stroke(); }
      g.fillStyle='#0066FF'; g.font='bold 13px sans-serif';
      for(let i=0;i<=10;i++){ g.fillText((i/10).toFixed(1), off+i*N/10+2, 13); g.fillText((i/10).toFixed(1), off+3, i*N/10+13); }
    }
    // 손 앵커 표시 (heroHand 는 발밑 기준 sz 단위 : x, y)
    const hh=T.heroHand? T.heroHand() : null;
    if(hh){
      // 그림 좌표계 : 몸은 (ox-sz/2, oy-sz*BASE_F, sz, sz) 로 그려진다
      // → 그림 안에서 손 = (0.5 + hh[0], BASE_F + hh[1])
      const BF=112/120;
      const fx=(0.5+hh[0])*N, fy=(BF+hh[1])*N;
      for(const off of [0,N]){
        g.strokeStyle='#00C000'; g.lineWidth=4;
        g.beginPath(); g.arc(off+fx, fy, 16, 0, 6.2832); g.stroke();
        g.beginPath(); g.moveTo(off+fx-26,fy); g.lineTo(off+fx+26,fy);
        g.moveTo(off+fx,fy-26); g.lineTo(off+fx,fy+26); g.stroke();
      }
      g.fillStyle='#000'; g.font='bold 18px sans-serif';
      g.fillText('몸 그림 + 손앵커 ('+hh[0].toFixed(3)+', '+hh[1].toFixed(3)+')', 8, N+26);
      g.fillText('앞발 레이어(무기 위에 덮는 부분)', N+8, N+26);
    }
    return C.toDataURL('image/png').split(',')[1];
  });
  require('fs').writeFileSync('/tmp/paw_diag.png', Buffer.from(b64,'base64'));
  await b.close(); console.log('ok');
})();
