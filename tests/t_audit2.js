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
    /* heroDollCanvas 와 완전히 같은 좌표계 */
    const OUT=224, BIG=Math.round(OUT*1.7), sz=176;
    const ox=BIG*0.5, oy=BIG*0.5+sz*0.30, BF=T.BASE_F;
    const hh=T.heroHand();
    const fx=ox+sz*hh[0], fy=oy+sz*hh[1];              // 주먹 중심
    /* 몸(그리고 얼굴) 상자 : 몸은 (ox-sz/2, oy-sz*BF, sz, sz) 에 그려진다.
       그림 안 얼굴 영역은 격자 실측으로 x 0.30~0.72, y 0.26~0.60 */
    const bxL=ox-sz*0.5, bxT=oy-sz*BF;
    const FX0=bxL+sz*0.30, FX1=bxL+sz*0.72, FY0=bxT+sz*0.26, FY1=bxT+sz*0.60;
    const out=[];
    T.S.eq=T.S.eq||{};
    for(let tn=0; tn<T.WEP_TYPE.length; tn++){
      let id=null;
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0 && e.tn===tn){ id=k; break; } }
      if(!id){ out.push({n:T.WEP_TYPE[tn].n, err:'장비없음'}); continue; }
      T.S.eq[id]=1; T.eqSet('w', id);
      await new Promise(r=>setTimeout(r,20));
      const wsp=T.eqSprWorld(id), wg=T.wepGrip(id);
      if(!wsp){ out.push({n:T.WEP_TYPE[tn].n, err:'무기 그림 없음'}); continue; }
      const WS=sz*0.50, ws=WS*(wg.s||1);
      /* 무기만 따로 그린다 (같은 변환) */
      const c=document.createElement('canvas'); c.width=BIG; c.height=BIG;
      const g=c.getContext('2d');
      g.save(); g.translate(fx,fy); g.rotate(wg.rot);
      g.drawImage(wsp, -ws*wg.x, -ws*wg.y, ws, ws); g.restore();
      const d=g.getImageData(0,0,BIG,BIG).data;
      let minx=1e9,miny=1e9,maxx=-1,maxy=-1,cnt=0,face=0,nearFist=0;
      for(let y=0;y<BIG;y++){ const row=y*BIG;
        for(let x=0;x<BIG;x++){ if(d[(row+x)*4+3]>24){ cnt++;
          if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y;
          if(x>=FX0&&x<=FX1&&y>=FY0&&y<=FY1) face++;
          const dx=x-fx, dy=y-fy; if(dx*dx+dy*dy < (sz*0.09)*(sz*0.09)) nearFist++;
        } } }
      if(!cnt){ out.push({n:T.WEP_TYPE[tn].n, err:'빈 그림'}); continue; }
      out.push({n:T.WEP_TYPE[tn].n, cnt,
        len:+(Math.max(maxx-minx,maxy-miny)/sz).toFixed(3),   // 캐릭터 키 대비 길이
        face:+(face/cnt*100).toFixed(1),
        grip:nearFist,                                        // 주먹 근처 무기 픽셀
        bx:[Math.round(minx),Math.round(miny),Math.round(maxx),Math.round(maxy)],
        clip:(minx<2||miny<2||maxx>BIG-3||maxy>BIG-3)?1:0});
    }
    return {out, fist:[Math.round(fx),Math.round(fy)], BIG};
  });
  const R=res.out;
  console.log('무기       길이/키  얼굴가림%  주먹픽셀  잘림  판정');
  let bad=[];
  for(const r of R){
    if(r.err){ console.log(r.n.padEnd(8)+' ❌ '+r.err); bad.push(r.n+':'+r.err); continue; }
    const pr=[];
    if(r.face>4) pr.push('얼굴');
    if(r.grip<60) pr.push('손과떨어짐');
    if(r.clip) pr.push('잘림');
    if(r.len<0.30) pr.push('작음');
    if(r.len>1.60) pr.push('큼');
    if(pr.length) bad.push(r.n+':'+pr.join(','));
    console.log(r.n.padEnd(8)+String(r.len).padStart(8)+String(r.face).padStart(10)
      +String(r.grip).padStart(9)+String(r.clip).padStart(6)+'  '+(pr.length?'❌ '+pr.join(','):'✅'));
  }
  console.log('\n문제 '+bad.length+' / '+R.length);
  if(bad.length) console.log(bad.join('  |  '));
  await b.close();
})();
