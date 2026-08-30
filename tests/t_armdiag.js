const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1500,height:340},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const info=await p.evaluate(async()=>{
    const T=window.__TORI, sz=176, BF=T.BASE_F, BIG=300;
    const host=document.createElement('div');
    host.style.cssText='position:fixed;left:0;top:0;z-index:99999;display:flex;background:#EFE7D8';
    document.body.appendChild(host);
    let tn=-1; T.WEP_TYPE.forEach((w,k)=>{ if(w.id==='great') tn=k; });
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } }
    const want={};
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot!==1) continue;
      const c=T.__armCls(e); if(c&&!want[c]) want[c]=k; }
    const out=[];
    const list=[['맨몸',null]].concat(Object.keys(want).map(c=>[c,want[c]]));
    for(const [cls,id] of list){
      if(id){ T.S.eq[id]=1; T.eqSet('a', id); } else { T.eqSet('a', null); }
      T.refreshHeroArt();
      await new Promise(r=>setTimeout(r,120));
      const c=document.createElement('canvas'); c.width=BIG; c.height=BIG;
      const g=c.getContext('2d');
      const ox=BIG*0.5, oy=BIG*0.66;
      g.drawImage(T.SPR.hero.idle, ox-sz*0.5, oy-sz*BF, sz, sz);
      const F=T.heroHand();
      const fx=ox+sz*F[0], fy=oy+sz*F[1];
      // 몸 실루엣
      const d=g.getImageData(0,0,BIG,BIG).data;
      let x0=1e9,y0=1e9,x1=-1,y1=-1;
      for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++) if(d[(y*BIG+x)*4+3]>50){
        if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
      T.drawHandOver(g, fx, fy, sz, -1.5708);
      g.strokeStyle='#FF0000'; g.lineWidth=2;
      g.beginPath(); g.arc(fx,fy,sz*F[2]*0.5,0,6.28); g.stroke();
      c.style.cssText='width:300px;height:300px'; host.appendChild(c);
      out.push({cls, F:[+F[0].toFixed(3),+F[1].toFixed(3),+F[2].toFixed(3)],
        body:[x0,x1,y0,y1], fx:Math.round(fx), fy:Math.round(fy),
        '주먹이몸안': (fx>=x0&&fx<=x1&&fy>=y0&&fy<=y1)});
    }
    return out;
  });
  console.log(JSON.stringify(info,null,1));
  await p.waitForTimeout(300);
  await p.screenshot({path:'/tmp/armdiag.png', clip:{x:0,y:0,width:Math.min(1500,300*info.length),height:300}});
  await b.close();
})();
