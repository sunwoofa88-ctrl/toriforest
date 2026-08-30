/* 새 프레임 마스터가 실제로 칠하는 픽셀 수(=A9+ 부하)를 옛 스프라이트와 비교한다.
   "이펙트 크면 렉" — 그래서 모양은 좋아지되 칠하는 면적은 줄어야 한다. */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, S=T.SPR;
    function ink(cv){                       // 알파 가중 합 = 실제 칠하는 양
      const g=cv.getContext('2d'), d=g.getImageData(0,0,cv.width,cv.height).data;
      let s=0; for(let i=3;i<d.length;i+=4) s+=d[i];
      return s/255/(cv.width*cv.height);    // 0~1 : 캔버스 대비 채움 비율
    }
    const out={ringOld:ink(S.fx.ring), ringF:(S.fx.ringF||[]).map(ink),
                slashOld:null, slashF:(S.fx.slashF||[]).map(ink),
                mcircle:S.fx.mcircle?ink(S.fx.mcircle):null,
                waveF:(S.fx.wave||[]).map(ink)};
    try{ out.slashOld=ink(T.slashSpr('#66DD55')); }catch(e){ out.slashOld='n/a'; }
    return out;
  });
  const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):0;
  console.log('── 칠하는 양(캔버스 대비 비율, 낮을수록 A9+ 부담 적음) ──');
  console.log('링  옛:', r.ringOld.toFixed(4), ' 새 5프레임:', r.ringF.map(v=>v.toFixed(4)).join(' '),
              ' 평균:', avg(r.ringF).toFixed(4),
              r.ringF.length? (avg(r.ringF)<r.ringOld? '  → '+((1-avg(r.ringF)/r.ringOld)*100).toFixed(1)+'% 감소':'  → 증가!') : '');
  console.log('참격 옛:', typeof r.slashOld==='number'?r.slashOld.toFixed(4):r.slashOld,
              ' 새 3프레임:', r.slashF.map(v=>v.toFixed(4)).join(' '), ' 평균:', avg(r.slashF).toFixed(4));
  if(typeof r.slashOld==='number' && r.slashF.length)
    console.log('   참격 변화:', (avg(r.slashF)<r.slashOld? '-'+((1-avg(r.slashF)/r.slashOld)*100).toFixed(1)+'%' : '+'+((avg(r.slashF)/r.slashOld-1)*100).toFixed(1)+'%'));
  console.log('파동 3프레임:', r.waveF.map(v=>v.toFixed(4)).join(' '));
  console.log('마법진:', r.mcircle!==null?r.mcircle.toFixed(4):'없음');

  /* 화면에 그려지는 크기까지 반영한 '진짜 비용' :
     링은 k2 가 커질수록 크게 그려지므로, 무거운 프레임이 작게 그려지면 이득이다.
     비용 ∝ (칠하는 비율) × (그려지는 면적).  링: s2 = r*(0.2+k2)*0.5 */
  const cost = await p.evaluate(()=>{
    const T=window.__TORI, S=T.SPR;
    function ink(cv){ const g=cv.getContext('2d'), d=g.getImageData(0,0,cv.width,cv.height).data;
      let s=0; for(let i=3;i<d.length;i+=4) s+=d[i]; return s/255/(cv.width*cv.height); }
    const oldR=ink(S.fx.ring), newR=(S.fx.ringF||[]).map(ink);
    const oldS=ink(T.slashSpr('#66DD55')), newS=(S.fx.slashF||[]).map(ink);
    let co=0,cn=0, so=0,sn=0;
    for(let i=0;i<=100;i++){                       // k2 0→1 을 100 등분해 적분
      const k2=i/100, s2=(0.2+k2)*0.5, A=s2*s2;    // 면적 ∝ s2²
      co += oldR*A;
      const fi=(k2<0.14?0:(k2<0.34?1:(k2<0.58?2:(k2<0.80?3:4))));
      cn += (newR[fi]||oldR)*A;
      // 참격 : sz = (0.52+ease*0.66)*0.5 , ease=1-(1-k)³
      const k=i/100, ease=1-Math.pow(1-k,3), sz=(0.52+ease*0.66)*0.5, A2=sz*sz;
      so += oldS*A2;
      const si=(k<0.30?0:(k<0.66?1:2));
      sn += (newS[si]||oldS)*A2;
    }
    return {ringOld:co, ringNew:cn, slashOld:so, slashNew:sn};
  });
  console.log('── 화면 크기까지 반영한 실제 칠하기 비용 ──');
  console.log('링   옛', cost.ringOld.toFixed(3), '→ 새', cost.ringNew.toFixed(3),
    ' (' + (cost.ringNew<cost.ringOld?'-':'+') + (Math.abs(1-cost.ringNew/cost.ringOld)*100).toFixed(1) + '%)');
  console.log('참격 옛', cost.slashOld.toFixed(3), '→ 새', cost.slashNew.toFixed(3),
    ' (' + (cost.slashNew<cost.slashOld?'-':'+') + (Math.abs(1-cost.slashNew/cost.slashOld)*100).toFixed(1) + '%)');
  const costOK = cost.ringNew<=cost.ringOld && cost.slashNew<=cost.slashOld;
  console.log(costOK?'비용 검증 PASS (이펙트가 더 무거워지지 않았다)':'비용 검증 FAIL');
  console.log('에러:', errs.length);
  const ok = costOK && r.ringF.length===5 && r.slashF.length===3 && r.mcircle!==null && errs.length===0
          && avg(r.ringF) < r.ringOld;
  console.log(ok?'PASS':'FAIL');
  await b.close(); process.exit(ok?0:1);
})();
