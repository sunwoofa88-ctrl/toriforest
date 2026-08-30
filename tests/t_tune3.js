const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const res=await p.evaluate(async()=>{
    const T=window.__TORI;
    const OUT=224, BIG=Math.round(OUT*1.7), sz=176;
    const ox=BIG*0.5, oy=BIG*0.5+sz*0.30, BF=T.BASE_F;
    const hh=T.heroHand();
    const fx=ox+sz*hh[0], fy=oy+sz*hh[1];
    const bxL=ox-sz*0.5, bxT=oy-sz*BF;
    const FX0=bxL+sz*0.30, FX1=bxL+sz*0.72, FY0=bxT+sz*0.26, FY1=bxT+sz*0.60;
    const cv=document.createElement('canvas'); cv.width=BIG; cv.height=BIG;
    const g=cv.getContext('2d');
    function measure(id){
      const wsp=T.eqSprWorld(id), wg=T.wepGrip(id);
      if(!wsp) return null;
      const ws=sz*0.50*(wg.s||1);
      g.clearRect(0,0,BIG,BIG);
      g.save(); g.translate(fx,fy); g.rotate(wg.rot);
      g.drawImage(wsp, -ws*wg.x, -ws*wg.y, ws, ws); g.restore();
      const d=g.getImageData(0,0,BIG,BIG).data;
      let minx=1e9,miny=1e9,maxx=-1,maxy=-1,cnt=0,face=0,grip=0;
      for(let y=0;y<BIG;y++){ const row=y*BIG;
        for(let x=0;x<BIG;x++){ if(d[(row+x)*4+3]>24){ cnt++;
          if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y;
          if(x>=FX0&&x<=FX1&&y>=FY0&&y<=FY1) face++;
          const dx=x-fx, dy=y-fy; if(dx*dx+dy*dy<(sz*0.09)*(sz*0.09)) grip++;
        } } }
      if(!cnt) return null;
      return {cnt, len:Math.max(maxx-minx,maxy-miny)/sz, face:face/cnt*100, grip,
              clip:(minx<2||miny<2||maxx>BIG-3||maxy>BIG-3)?1:0};
    }
    const targets=JSON.parse(document.title==='x'?'[]':'["kusari","cball","rune","umbrella","sling","whip","fan","topspin","fishrod"]');
    const out=[];
    T.S.eq=T.S.eq||{};
    for(const wid of targets){
      let id=null, tn=-1;
      T.WEP_TYPE.forEach((w,i)=>{ if(w.id===wid) tn=i; });
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0 && e.tn===tn){ id=k; break; } }
      if(id===null||tn<0){ out.push({wid, err:'없음'}); continue; }
      T.S.eq[id]=1; T.eqSet('w', id);
      await new Promise(r=>setTimeout(r,15));
      const H=T.W_TYPE_HOLD[wid];
      const s0=H[0], a0=H[1], h0=H[2], g0=H[3];
      let best=null;
      for(let ds=0; ds<11; ds++){
        const sc = s0 * (0.72 + ds*0.11);
        for(let da=-12; da<=12; da++){
          const ang = a0 + da*0.09;
          for(let dg=0; dg<9; dg++){
            const gp = 0.14 + dg*0.055;
            H[0]=sc; H[1]=ang; H[3]=gp;
            const m=measure(id);
            if(!m) continue;
            if(m.clip) continue;
            if(m.len<0.34 || m.len>0.75) continue;
            if(m.grip<200) continue;
            const score = m.face*14 + Math.abs(m.len-0.46)*20 + Math.abs(da)*0.30
                        + Math.abs(ds-2.5)*0.28 + Math.abs(gp-g0)*3.0
                        + Math.max(0,420-m.grip)*0.006;
            if(!best || score<best.score) best={score, s:+sc.toFixed(3), a:+ang.toFixed(3), gp:+gp.toFixed(3), ...m};
          }
        }
      }
      H[0]=s0; H[1]=a0; H[2]=h0; H[3]=g0;
      out.push({wid, before:{s:s0,a:a0,gp:g0}, best});
    }
    return out;
  });
  console.log('무기        크기      각도    자루위치  길이/키  얼굴%  주먹');
  const fix=[];
  for(const r of res){
    if(r.err||!r.best){ console.log(r.wid.padEnd(10)+' 해 없음'); continue; }
    const b2=r.best;
    console.log(r.wid.padEnd(10)+String(b2.s).padStart(7)+String(b2.a).padStart(9)
      +String(b2.gp).padStart(9)
      +b2.len.toFixed(3).padStart(9)+b2.face.toFixed(1).padStart(7)+String(b2.grip).padStart(6));
    fix.push([r.wid, b2.s, b2.a, b2.gp]);
  }
  require('fs').writeFileSync('/tmp/fix3.json', JSON.stringify(fix));
  await b.close();
})();
