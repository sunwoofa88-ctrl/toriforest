const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1500,height:700},deviceScaleFactor:1.5});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const info=await p.evaluate(()=>{
    const T=window.__TORI, S=T.SPECIES, keys=Object.keys(S);
    const holder=document.createElement('div');
    holder.style.cssText='position:fixed;left:0;top:0;z-index:99999;display:flex;flex-wrap:wrap;background:#DCD3C2;width:1500px';
    document.body.appendChild(holder);
    const pickd=[];
    for(let i=0;i<8;i++){ pickd.push(keys[i]); }
    for(const k of pickd){
      const sp=S[k];
      const c=(T.ensureMob? (T.ensureMob(k)||{}).n : null);
      const cv=document.createElement('canvas'); cv.width=cv.height=150;
      const g=cv.getContext('2d');
      if(c){ g.drawImage(c,0,0,150,150); }
      cv.style.cssText='width:150px;height:150px';
      holder.appendChild(cv);
    }
    return {total:keys.length, shown:pickd.length};
  });
  console.log(JSON.stringify(info));
  await p.waitForTimeout(500);
  await p.screenshot({path:'/tmp/mons.png', clip:{x:0,y:0,width:1500,height:600}});
  await b.close();
})();
