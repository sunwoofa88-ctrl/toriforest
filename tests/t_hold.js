const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1400,height:900},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1200);
  // 48종 전부 장착해서 인형을 굽는다
  const b64=await p.evaluate(async()=>{
    const T=window.__TORI, out=[];
    T.S.eq=T.S.eq||{};
    for(let tn=0; tn<T.WEP_TYPE.length; tn++){
      let id=null;
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0 && e.tn===tn){ id=k; break; } }
      if(!id){ out.push(null); continue; }
      T.S.eq[id]=1; T.eqSet('w', id);
      await new Promise(r=>setTimeout(r,30));
      let c=null; try{ c=T.heroDollCanvas(); }catch(e){}
      out.push({n:T.WEP_TYPE[tn].n, d:c? c.toDataURL('image/png') : null});
    }
    // 12열 x 4행 대지에 합친다
    const CW=170, cols=12, rows=Math.ceil(out.length/cols);
    const C=document.createElement('canvas'); C.width=CW*cols; C.height=(CW+22)*rows;
    const g=C.getContext('2d'); g.fillStyle='#F4EBDA'; g.fillRect(0,0,C.width,C.height);
    for(let i=0;i<out.length;i++){
      const o=out[i]; if(!o||!o.d) continue;
      const im=new Image(); im.src=o.d; await im.decode();
      const cx=(i%cols)*CW, cy=Math.floor(i/cols)*(CW+22);
      g.drawImage(im, cx+5, cy+2, CW-10, CW-10);
      g.fillStyle='#3A2A18'; g.font='bold 15px sans-serif'; g.textAlign='center';
      g.fillText(o.n, cx+CW/2, cy+CW+13);
      g.strokeStyle='#C9B79A'; g.strokeRect(cx+1,cy+1,CW-2,CW+18);
    }
    return C.toDataURL('image/png').split(',')[1];
  });
  require('fs').writeFileSync('/tmp/hold48.png', Buffer.from(b64,'base64'));
  await b.close(); console.log('ok');
})();
