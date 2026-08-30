/* 감사 v4(임시) — t_audit3와 같은 방식이지만 갑옷 6종 × 대표 무기 8종(계열별 1개)을
   실제로 갑옷을 입힌 몸 그림 기준으로 측정한다. t_audit3는 항상 맨몸(T.SPR.hero.idle)만
   기준으로 삼아서 갑옷 착용 시의 얼굴/몸통 겹침을 전혀 못 봤다 — 그 사각지대를 메운다. */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:1});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1000);
  const R=await p.evaluate(async()=>{
    const T=window.__TORI;
    const BIG=381, sz=176;
    const ox=BIG*0.5, oy=BIG*0.5+sz*0.30;
    const cv=document.createElement('canvas'); cv.width=BIG; cv.height=BIG;
    const g=cv.getContext('2d');
    T.EN.length=0; T.P.atkT=0; T.P.moving=false;

    // 대표 무기(계열별 1개) — small/blade/heavy/blunt/pole/staff/bow/item
    const reps={};
    T.WEP_TYPE.forEach((w,tn)=>{ /* placeholder */ });
    const wantClsW={};
    for(let tn=0; tn<T.WEP_TYPE.length; tn++){
      const wt=T.WEP_TYPE[tn];
      // WEP_CLASS 는 페이지 스코프라 직접 못 읽으니 대신 T.wepFam 등은 없다 —
      // 대신 알려진 대표 타입 id로 찾는다.
    }
    const REP_TYPE_IDS=['sword','great','club','spear','staff','bow','wand','dagger'];
    for(const tid of REP_TYPE_IDS){
      let tn=-1; T.WEP_TYPE.forEach((w,k)=>{ if(w.id===tid) tn=k; });
      if(tn<0) continue;
      let id=null;
      for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ id=k; break; } }
      if(id) wantClsW[tid]=id;
    }

    const wantArm={};
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot!==1) continue;
      const cls=T.__armCls(e); if(cls && !wantArm[cls]) wantArm[cls]=k; }

    function faceBoxOf(bodyImg){
      g.clearRect(0,0,BIG,BIG);
      g.drawImage(bodyImg, ox-sz*0.5, oy-sz*T.BASE_F, sz, sz);
      const bd=g.getImageData(0,0,BIG,BIG).data;
      const body=new Uint8Array(BIG*BIG);
      let bx0=1e9,by0=1e9,bx1=-1,by1=-1;
      for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++){ if(bd[(y*BIG+x)*4+3]>50){ body[y*BIG+x]=1;
        if(x<bx0)bx0=x; if(x>bx1)bx1=x; if(y<by0)by0=y; if(y>by1)by1=y; } }
      const bw=bx1-bx0+1, bh=by1-by0+1;
      return { body, FX0:bx0+bw*0.26, FX1:bx0+bw*0.78, FY0:by0+bh*0.08, FY1:by0+bh*0.46, bh };
    }

    const out=[];
    for(const acls of ['bare', ...Object.keys(wantArm)]){
      if(acls==='bare'){ for(const k of Object.values(wantArm)) T.S.eq[k]=0; }
      else { T.S.eq[wantArm[acls]]=1; T.eqSet('a', wantArm[acls]); }
      T.refreshHeroArt();
      const bodyImg=T.SPR.hero.idle;
      const {body,FX0,FX1,FY0,FY1,bh}=faceBoxOf(bodyImg);
      for(const tid of Object.keys(wantClsW)){
        const id=wantClsW[tid];
        T.S.eq[id]=1; T.eqSet('w', id);
        T.EN.length=0; T.P.atkT=0; T.P.moving=false;
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        await new Promise(r=>setTimeout(r,10));
        const F=T.heroHand();
        const fx=ox+sz*F[0], fy=oy+sz*F[1], fr=sz*F[2]*0.85;
        const wsp=T.eqSprWorld(id), wg=T.wepGrip(id);
        if(!wsp){ out.push({acls,tid,err:'그림없음'}); continue; }
        const ws=sz*0.50*(wg.s||1);
        g.clearRect(0,0,BIG,BIG);
        g.save(); g.translate(fx,fy); g.rotate(wg.rot);
        g.drawImage(wsp, -ws*wg.x, -ws*wg.y, ws, ws); g.restore();
        const d=g.getImageData(0,0,BIG,BIG).data;
        let n=0, face=0, torso=0;
        for(let y=0;y<BIG;y++)for(let x=0;x<BIG;x++){
          if(d[(y*BIG+x)*4+3]<=24) continue;
          n++;
          if(x>=FX0&&x<=FX1&&y>=FY0&&y<=FY1) face++;
          const dx=x-fx, dy=y-fy;
          if(dx*dx+dy*dy<fr*fr) continue;
          if(body[y*BIG+x]) torso++;
        }
        out.push({acls, tid, face:+(face/n*100).toFixed(1), torso:+(torso/n*100).toFixed(1)});
      }
    }
    return out;
  });
  console.log('갑옷        무기       얼굴%   몸통%');
  for(const r of R){
    if(r.err){ console.log(r.acls.padEnd(10)+r.tid.padEnd(10)+'❌ '+r.err); continue; }
    const bad = (r.face>2.5||r.torso>26);
    console.log(r.acls.padEnd(10)+r.tid.padEnd(10)+String(r.face).padStart(6)+String(r.torso).padStart(7)+'  '+(bad?'❌':'✅'));
  }
  require('fs').writeFileSync('/tmp/audit_armor.json', JSON.stringify(R,null,1));
  await b.close();
})();
