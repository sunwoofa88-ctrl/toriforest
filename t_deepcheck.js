/* 전수 정밀 점검 : 기존 검사가 안 보는 불변식을 직접 확인한다 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1340,height:820},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push('pageerror: '+e));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts\.g/.test(m.text()))errs.push('console: '+m.text());});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);

  const R=await p.evaluate(()=>{
    const T=window.__TORI, F=[];
    const fail=(s)=>F.push(s);

    /* ① 모든 장비를 하나씩 실제로 착용해 본다 — 예외·빈 그림 검출 */
    let n=0, blank=0, thrown=0;
    for(const id of T.EQ_IDS){
      const E=T.EQUIP[id]; if(!E) continue;
      try{
        T.S.eq={}; T.S.eqW=null; T.S.eqA=null; if(T.S.eqOn) T.S.eqOn={};
        T.giveEquip(id);
        if(E.slot===0) T.S.eqW=id; else if(E.slot===1) T.S.eqA=id; else T.S.eq[E.slot]=id;
        if(T.S.eqOn) T.S.eqOn[E.slot]=id;
        T.refreshHeroArt&&T.refreshHeroArt();
        const sp=T.eqSpr(id,96);
        if(!sp){ blank++; fail('아이콘 없음: '+id); continue; }
        const g=sp.getContext('2d'), d=g.getImageData(0,0,sp.width,sp.height).data;
        let al=0; for(let i=3;i<d.length;i+=4) al+=d[i];
        if(al/255/(sp.width*sp.height) < 0.02){ blank++; fail('아이콘이 거의 빈 그림: '+id); }
        n++;
      }catch(e){ thrown++; fail('착용 중 예외 '+id+': '+e.message); }
    }

    /* ② 착용 인형이 항상 그려지는가 (전 슬롯 조합 표본) */
    let dollFail=0;
    const heads=[], arms=[], weps=[];
    for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue;
      if(E.slot===2 && heads.length<6) heads.push(id);
      if(E.slot===1 && arms.length<6) arms.push(id);
      if(E.slot===0 && weps.length<8) weps.push(id); }
    for(const h of heads) for(const a of arms){
      try{
        T.S.eq={}; if(T.S.eqOn) T.S.eqOn={};
        T.giveEquip(h); T.giveEquip(a);
        T.S.eqA=a; T.S.eq[2]=h;
        if(T.S.eqOn){ T.S.eqOn[1]=a; T.S.eqOn[2]=h; }
        T.refreshHeroArt&&T.refreshHeroArt();
        const c=T.heroDollCanvas();
        if(!c || !c.width) { dollFail++; fail('인형 없음 '+h+'+'+a); continue; }
        const g=c.getContext('2d'), d=g.getImageData(0,0,c.width,c.height).data;
        let al=0; for(let i=3;i<d.length;i+=4) al+=d[i];
        const fillRatio=al/255/(c.width*c.height);
        if(fillRatio<0.05){ dollFail++; fail('인형이 거의 빔 '+h+'+'+a+' ('+fillRatio.toFixed(3)+')'); }
      }catch(e){ dollFail++; fail('인형 예외 '+h+'+'+a+': '+e.message); }
    }

    /* ③ 착용 레이어 그림이 전부 존재하는가 */
    const need=['hw_cap','hw_helm','hw_horn','hw_hood','hw_mask','hw_crown','bw_cape','fw_boots'];
    for(const k of need) if(!T.artOf(k)) fail('착용 레이어 그림 없음: '+k);

    /* ④ 색상각 표에 없는 그림 키가 쓰이는가 */
    for(const id of T.EQ_IDS){ const k=T.dbg.artKey(id);
      if(k && k!=='none' && k!=='?' && T.artOf(k) && !(k in T.EQ_ART_HUE)) fail('색상각 표 누락: '+k); }

    /* ⑤ 무기 손잡이 표 : 그림 있는 무기는 전부 표에 있어야 한다 */
    const wg=T.W_GRIP||{};
    const seen=new Set();
    for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E||E.slot!==0) continue;
      const k=T.dbg.artKey(id);
      if(k && k!=='none' && T.artOf(k) && !seen.has(k)){ seen.add(k);
        if(!wg[k]) fail('손잡이 좌표 없음: '+k); } }

    /* ⑥ 세이브/로드 왕복 */
    try{
      T.S.eq={}; T.giveEquip(weps[0]); T.S.eqW=weps[0]; if(T.S.eqOn) T.S.eqOn[0]=weps[0];
      T.save();
      const raw=localStorage.getItem(Object.keys(localStorage).find(k=>/tori|dotori/i.test(k))||'');
      if(!raw) fail('세이브가 저장되지 않았다');
    }catch(e){ fail('세이브 예외: '+e.message); }

    return {장비수:n, 빈아이콘:blank, 착용예외:thrown, 인형실패:dollFail,
            무기그림수:seen.size, 실패:F};
  });

  console.log('장비 착용 시험:', R.장비수, '개  · 빈 아이콘', R.빈아이콘, '· 예외', R.착용예외);
  console.log('인형 조합 시험 실패:', R.인형실패);
  console.log('그림 있는 무기 종류:', R.무기그림수);
  console.log('페이지 오류:', errs.length);
  if(errs.length) console.log('  '+errs.slice(0,5).join('\n  '));
  if(R.실패.length){
    console.log('\n❌ 발견된 문제', R.실패.length, '건:');
    const uniq=[...new Set(R.실패)];
    console.log('  '+uniq.slice(0,25).join('\n  '));
    if(uniq.length>25) console.log('  ... 외 '+(uniq.length-25)+'건');
  } else console.log('\n✅ 불변식 위반 없음');
  await b.close();
  process.exit((R.실패.length===0 && errs.length===0)?0:1);
})();
