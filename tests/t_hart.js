const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:200}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, ks=['hand_bare','hand_leather','hand_steel','hand_magic'];
    const c=document.createElement('canvas'); c.width=4*128; c.height=128;
    const g=c.getContext('2d'); const info=[];
    ks.forEach((k,i)=>{ const im=T.artOf(k);
      if(im){ g.drawImage(im, i*128,0,128,128);
        // 중앙 색 표본
        const t=document.createElement('canvas'); t.width=t.height=128;
        const tg=t.getContext('2d'); tg.drawImage(im,0,0,128,128);
        const d=tg.getImageData(40,60,1,1).data;
        info.push(k+' '+(im.width||im.naturalWidth)+'px rgb('+d[0]+','+d[1]+','+d[2]+')'); }
      else info.push(k+' 없음');
    });
    c.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#eee';
    document.body.appendChild(c);
    return info;
  });
  console.log(r.join('\n'));
  await p.screenshot({path:'/tmp/hart.png', clip:{x:0,y:0,width:512,height:128}});
  await b.close();
})();
