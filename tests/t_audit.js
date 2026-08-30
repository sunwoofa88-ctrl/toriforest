const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const rows=await p.evaluate(async()=>{
    const T=window.__TORI;
    function px(c){ return c.getContext('2d').getImageData(0,0,c.width,c.height).data; }
    // 무기 없는 몸만
    T.S.eq=T.S.eq||{};
    T.eqSet('w', null);
    await new Promise(r=>setTimeout(r,60));
    const base=T.heroDollCanvas(); const N=base.width;
    const bd=px(base);
    // 얼굴 상자 : 몸 그림에서 눈 영역. 인형 캔버스에서 대략
    // 몸은 (ox-sz/2, oy-sz*BASE_F, sz, sz), ox=N/2, oy=N/2+sz*0.30, sz=176*? -> 비율로 잡는다
    // 실측 : 인형 224px 기준 얼굴은 x 0.40~0.68, y 0.30~0.52
    const FX0=Math.round(N*0.40), FX1=Math.round(N*0.68), FY0=Math.round(N*0.30), FY1=Math.round(N*0.52);
    // 손 앵커

    const sz=176, ox=N*0.5, oy=N*0.5+sz*0.30;   // heroDollCanvas 와 동일
    const S=N/ (Math.round(224*1.7));           // 출력 캔버스로 맞춘 배율 (근사)
    const out=[];
    for(let tn=0; tn<T.WEP_TYPE.length; tn++){
      let id=null;
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0 && e.tn===tn){ id=k; break; } }
      if(!id){ out.push({n:T.WEP_TYPE[tn].n, err:'장비없음'}); continue; }
      T.S.eq[id]=1; T.eqSet('w', id);
      await new Promise(r=>setTimeout(r,25));
      const c=T.heroDollCanvas(); const d=px(c);
      // 무기 픽셀 = 베이스와 다른 픽셀
      let minx=1e9,miny=1e9,maxx=-1,maxy=-1, cnt=0, face=0, edge=0;
      for(let y=0;y<N;y++) for(let x=0;x<N;x++){
        const i=(y*N+x)*4;
        const da=Math.abs(d[i]-bd[i])+Math.abs(d[i+1]-bd[i+1])+Math.abs(d[i+2]-bd[i+2])+Math.abs(d[i+3]-bd[i+3]);
        if(da>40){ cnt++;
          if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y;
          if(x>=FX0&&x<=FX1&&y>=FY0&&y<=FY1) face++;
          if(x<3||y<3||x>N-4||y>N-4) edge++;
        }
      }
      if(cnt<40){ out.push({n:T.WEP_TYPE[tn].n, err:'무기 안 그려짐', cnt}); continue; }
      const w=maxx-minx+1, h=maxy-miny+1;
      out.push({n:T.WEP_TYPE[tn].n, cnt,
        size:+(Math.max(w,h)/N).toFixed(3),
        face:+(face/cnt*100).toFixed(1),
        clip:edge,
        bx:[minx,miny,maxx,maxy]});
    }
    return {out, N, FX:[FX0,FX1,FY0,FY1]};
  });
  const R=rows.out;
  console.log('무기            픽셀   크기비  얼굴가림%  캔버스밖  판정');
  let bad=0;
  for(const r of R){
    if(r.err){ console.log(r.n.padEnd(8)+' ❌ '+r.err); bad++; continue; }
    const probs=[];
    if(r.face>6) probs.push('얼굴가림');
    if(r.clip>0) probs.push('잘림');
    if(r.size<0.22) probs.push('너무작음');
    if(r.size>0.72) probs.push('너무큼');
    if(probs.length) bad++;
    console.log(r.n.padEnd(8)+String(r.cnt).padStart(6)+String(r.size).padStart(8)
      +String(r.face).padStart(9)+String(r.clip).padStart(9)+'   '+(probs.length?'❌ '+probs.join(','):'✅'));
  }
  console.log('\n문제 '+bad+' / '+R.length);
  await b.close();
})();
