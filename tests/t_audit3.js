/* 감사 v3 — 얼굴만 보던 걸 버리고 '몸통 실루엣'과 '손과의 접촉'까지 본다.
   무기 레이어만 따로 그려서 몸 마스크와 겹치는 픽셀을 센다. */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  // ★ 2026-08-30 발견 : beginPlay()로 실제 몬스터가 주변에 있으면 자동 전투가 돌아가서
  //   P.atkT가 수시로 켜진다 — 자세 그림 배선 이후엔 attack 상태가 idle과 다른 자루각을
  //   쓰므로, 이걸 안 막으면 이 감사가 '무기를 갈아 낄 때마다 우연히 idle이었는지 atk였는지'
  //   에 따라 결과가 흔들린다(실제로 흔들리는 걸 확인했다). 몬스터를 계속 비워 idle을 강제한다.
  await p.evaluate(()=>{const T=window.__TORI;T.EN.length=0; T.P.atkT=0; T.P.moving=false;});
  const R=await p.evaluate(async()=>{
    const T=window.__TORI;
    const BIG=381, sz=176, BF=T.BASE_F;
    const ox=BIG*0.5, oy=BIG*0.5+sz*0.30;
    const cv=document.createElement('canvas'); cv.width=BIG; cv.height=BIG;
    const g=cv.getContext('2d');
    // ── 몸 마스크 + 얼굴 상자(눈 높이대) ────────────────────────
    g.drawImage(T.SPR.hero.idle, ox-sz*0.5, oy-sz*BF, sz, sz);
    const bd=g.getImageData(0,0,BIG,BIG).data;
    const body=new Uint8Array(BIG*BIG);
    let bx0=1e9,by0=1e9,bx1=-1,by1=-1;
    for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++){ if(bd[(y*BIG+x)*4+3]>50){ body[y*BIG+x]=1;
      if(x<bx0)bx0=x; if(x>bx1)bx1=x; if(y<by0)by0=y; if(y>by1)by1=y; } }
    const bw=bx1-bx0+1, bh=by1-by0+1;
    // 얼굴 : 몸 bbox 안에서 가로 26~78% · 세로 8~46% (그림에서 눈·코 위치 확인함)
    const FX0=bx0+bw*0.26, FX1=bx0+bw*0.78, FY0=by0+bh*0.08, FY1=by0+bh*0.46;
    const out=[];
    T.S.eq=T.S.eq||{};
    for(let tn=0; tn<T.WEP_TYPE.length; tn++){
      let id=null;
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ id=k; break; } }
      if(!id){ out.push({n:T.WEP_TYPE[tn].n, err:'장비없음'}); continue; }
      T.S.eq[id]=1; T.eqSet('w', id);
      T.EN.length=0; T.P.atkT=0; T.P.moving=false;   // 자동전투 재발 방지(매 무기마다)
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));  // idle 상태로 렌더된 프레임까지 대기
      await new Promise(r=>setTimeout(r,10));
      // ★ 2026-08-30 자세 그림 배선 이후 : 계열에 따라 손 잡는점(F)이 계열마다
      //   완전히 달라질 수 있다(장병기는 팔이 몸 밖으로 뻗음) — 예전엔 루프 밖에서
      //   한 번만 재던 걸 계열이 바뀔 때마다(무기를 갈아 낄 때마다) 다시 잰다.
      //   몸 그림도 자세 그림이 켜졌으면 그 자세(팔 뻗은) 그림으로 다시 그린다.
      const F=T.heroHand();
      const fx=ox+sz*F[0], fy=oy+sz*F[1], fr=sz*F[2]*0.85;
      const pk=T.dbg.poseKey();
      const bodyImg = pk? (T.dbg.poseSpr(pk,'idle')||T.SPR.hero.idle) : T.SPR.hero.idle;
      const wsp=T.eqSprWorld(id), wg=T.wepGrip(id);
      if(!wsp){ out.push({n:T.WEP_TYPE[tn].n, err:'그림없음'}); continue; }
      const ws=sz*0.50*(wg.s||1);
      g.clearRect(0,0,BIG,BIG);
      g.drawImage(bodyImg, ox-sz*0.5, oy-sz*BF, sz, sz);   // 자세 반영 몸(참고용, 손 겹침 판정엔 안 씀)
      const bd2=g.getImageData(0,0,BIG,BIG).data;
      const body2=new Uint8Array(BIG*BIG);
      for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++){ if(bd2[(y*BIG+x)*4+3]>50) body2[y*BIG+x]=1; }
      g.clearRect(0,0,BIG,BIG);
      g.save(); g.translate(fx,fy); g.rotate(wg.rot);
      g.drawImage(wsp, -ws*wg.x, -ws*wg.y, ws, ws); g.restore();
      const d=g.getImageData(0,0,BIG,BIG).data;
      let n=0, face=0, torso=0, grip=0, x0=1e9,y0=1e9,x1=-1,y1=-1;
      for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++){
        if(d[(y*BIG+x)*4+3]<=24) continue;
        n++;
        if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
        if(x>=FX0&&x<=FX1&&y>=FY0&&y<=FY1) face++;
        const dx=x-fx, dy=y-fy, dd=dx*dx+dy*dy;
        if(dd<fr*fr) grip++;
        // 몸통 겹침 : 몸 실루엣 안(자세 반영) + 주먹 주변(자연스러운 겹침)은 뺀다
        else if(body2[y*BIG+x]) torso++;
      }
      if(!n){ out.push({n:T.WEP_TYPE[tn].n, err:'빈그림'}); continue; }
      out.push({n:T.WEP_TYPE[tn].n, id:T.WEP_TYPE[tn].id, n2:n, pose:pk||'',
        len:+(Math.max(x1-x0,y1-y0)/bh).toFixed(3),      // 캐릭터 '키' 기준 길이비
        face:+(face/n*100).toFixed(1), torso:+(torso/n*100).toFixed(1), grip,
        clip:(x0<2||y0<2||x1>BIG-3||y1>BIG-3)?1:0});
    }
    return out;
  });
  console.log('무기        길이/키  얼굴%  몸통%  손접촉  잘림  판정');
  const bad=[];
  for(const r of R){
    if(r.err){ console.log(r.n.padEnd(8)+' ❌ '+r.err); bad.push(r.n+':'+r.err); continue; }
    const pr=[];
    if(r.face>2.5) pr.push('얼굴');
    if(r.torso>26) pr.push('몸통');
    if(r.grip<70)  pr.push('손밖');
    if(r.clip)     pr.push('잘림');
    if(r.len<0.34) pr.push('작음');
    if(r.len>1.45) pr.push('큼');
    if(pr.length) bad.push(r.n+':'+pr.join(','));
    console.log(r.n.padEnd(9)+String(r.len).padStart(7)+String(r.face).padStart(7)
      +String(r.torso).padStart(7)+String(r.grip).padStart(7)+String(r.clip).padStart(5)
      +'  '+(pr.length?'❌ '+pr.join(','):'✅'));
  }
  console.log('\n문제 '+bad.length+' / '+R.length);
  if(bad.length) console.log(bad.join('  |  '));
  require('fs').writeFileSync('/tmp/audit3.json', JSON.stringify(R));
  await b.close();
})();
