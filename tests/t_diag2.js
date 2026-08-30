const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:400},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  await p.evaluate(()=>{
    const T=window.__TORI, BIG=280, sz=176, BF=T.BASE_F;
    const host=document.createElement('div');
    host.style.cssText='position:fixed;left:0;top:0;z-index:99999;display:flex;background:#EFE7D8';
    document.body.appendChild(host);
    function panel(fn){
      const c=document.createElement('canvas'); c.width=BIG; c.height=BIG;
      const g=c.getContext('2d');
      const ox=BIG*0.5, oy=BIG*0.62;
      fn(g,ox,oy);
      c.style.cssText='width:280px;height:280px'; host.appendChild(c);
    }
    const F=T.heroHand();
    // 1) 몸만
    panel((g,ox,oy)=>{ g.drawImage(T.SPR.hero.idle, ox-sz*0.5, oy-sz*BF, sz, sz); });
    // 2) 몸 + 실측 주먹 표시(빨간 원)
    panel((g,ox,oy)=>{ g.drawImage(T.SPR.hero.idle, ox-sz*0.5, oy-sz*BF, sz, sz);
      const fx=ox+sz*F[0], fy=oy+sz*F[1];
      g.strokeStyle='#FF0000'; g.lineWidth=2;
      g.beginPath(); g.arc(fx,fy,sz*F[2]*0.5,0,6.28); g.stroke();
      g.beginPath(); g.moveTo(fx-8,fy); g.lineTo(fx+8,fy); g.moveTo(fx,fy-8); g.lineTo(fx,fy+8); g.stroke(); });
    // 3) 몸 + 손 (무기 없이)
    panel((g,ox,oy)=>{ g.drawImage(T.SPR.hero.idle, ox-sz*0.5, oy-sz*BF, sz, sz);
      T.drawHandOver(g, ox+sz*F[0], oy+sz*F[1], sz, -1.5708); });
  });
  await p.waitForTimeout(300);
  await p.screenshot({path:'/tmp/diag3.png', clip:{x:0,y:0,width:840,height:280}});
  console.log('ok');
  await b.close();
})();
