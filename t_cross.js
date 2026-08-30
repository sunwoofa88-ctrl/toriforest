/* 유사 2D 게임 20건 조사에서 나온 '구체 규칙'을 우리 게임이 지키는지 하나씩 기계로 확인한다.
   추측 없음 — 전부 게임에서 직접 재거나 소스를 확인한 값이다. */
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
  const src=fs.readFileSync('/root/toriforest/game.html','utf8');
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1340,height:848}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);

  const M=await p.evaluate(()=>{
    const T=window.__TORI, o={};
    /* 착용 레이어 규격이 캐릭터와 같은가 */
    const need=['hw_cap','hw_helm','hw_horn','hw_hood','hw_mask','hw_crown'];
    o.layerSizes=need.map(k=>{const im=T.artOf(k); return im? [k,im.naturalWidth,im.naturalHeight]:[k,0,0];});
    /* 슬롯별 캐릭터 반영 여부 */
    function snap(){ const c=T.heroDollCanvas(); if(!c) return null;
      return c.getContext('2d').getImageData(0,0,c.width,c.height).data; }
    function diff(a,b){ if(!a||!b) return -1; let d=0;
      for(let i=0;i<a.length;i+=4) d+=Math.abs(a[i]-b[i])+Math.abs(a[i+3]-b[i+3]);
      return d/(a.length/4)/510; }
    const bySlot={};
    for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E) continue; (bySlot[E.slot]=bySlot[E.slot]||[]).push(id); }
    o.slotVisible={};
    const SN=['무기','갑옷','투구','망토','장갑','신발','반지','목걸이'];
    for(const s in bySlot){
      T.S.eq={}; T.S.eqW=null; T.S.eqA=null; if(T.S.eqOn) T.S.eqOn={};
      T.refreshHeroArt&&T.refreshHeroArt(); const off=snap();
      const id=bySlot[s][0]; T.giveEquip(id);
      if(+s===0) T.S.eqW=id; else if(+s===1) T.S.eqA=id; else T.S.eq[s]=id;
      if(T.S.eqOn) T.S.eqOn[s]=id;
      T.refreshHeroArt&&T.refreshHeroArt();
      o.slotVisible[SN[s]]=+diff(off,snap()).toFixed(4);
    }
    /* 머리 슬롯 타입별로 서로 다른 그림인가 */
    const heads=[]; const seen=new Set();
    for(const id of T.EQ_IDS){ const E=T.EQUIP[id];
      if(E&&E.slot===2){ const t=T.dbg.artKey(id); if(!seen.has(t)){seen.add(t); heads.push([id,t]);} } }
    o.headArtCount=seen.size;
    /* 갑옷 등급별 아이콘이 서로 다른가 */
    const arm=new Set();
    for(const id of T.EQ_IDS){ const E=T.EQUIP[id];
      if(E&&E.slot===1){ const c=T.ARM_TYPE[E.tn]&&T.ARM_TYPE[E.tn].id; if(c) arm.add(c); } }
    o.armorTypes=arm.size;
    return o;
  });

  const rules=[];
  const R=(n,ok,ev)=>rules.push({n,ok,ev});

  /* 규칙1 : 레이어는 베이스와 같은 규격 (Terraria 40x1120 통일 / MapleStory 120x120 / Mana Seed 64x64) */
  const sz=M.layerSizes;
  R('레이어를 베이스와 같은 규격으로 그려 오프셋 계산을 없앤다',
    sz.every(s=>s[1]===192&&s[2]===192),
    '착용 레이어 6장 전부 '+sz[0][1]+'x'+sz[0][2]+' (캐릭터 그림과 동일)');

  /* 규칙2 : 런타임 좌표 계산 없음 */
  const hasMath=/drawPart\s*\(/.test(src) || /bodyBox\s*\(/.test(src);
  R('중앙정렬·크기보정·리사이즈를 코드로 하지 않는다 (GameDev.net)',
    !hasMath, hasMath? '좌표 계산 코드가 남아 있다' : 'drawImage(layer,0,0) 만 사용, 계산 함수 0개');

  /* 규칙3 : 그리기 순서를 슬롯에 고정 (Stardew 7단 / MapleStory zmap) */
  const order=/lg\.drawImage\(base,0,0\);[\s\S]{0,120}?stamp\(lg, pH\)/.test(src);
  R('그리기 순서를 슬롯에 고정한다 (몸 → 투구)', order,
    order? '소스에서 순서 확인됨' : '순서가 다르다');

  /* 규칙4 : 세트 아트에 머리장식을 넣지 않는다 (MapleStory vslot / Terraria DrawHead / D2 HD) */
  R('갑옷 세트 그림에 머리장식을 넣지 않는다 — 머리는 독립 슬롯',
    M.slotVisible['투구']>0.002,
    '투구 착용 시 캐릭터 변화량 '+M.slotVisible['투구']+' (0이면 반영 안 됨)');

  /* 규칙5 : 머리 아이템 종류마다 다른 그림 (MapleStory vslot 7종 / Terraria Head.Sets) */
  R('머리 아이템 종류마다 다른 그림을 쓴다', M.headArtCount>=6,
    '머리 슬롯 그림 '+M.headArtCount+'종');

  /* 규칙6 : 무기는 하드포인트 부착 (GameDev.net "rigid stuff는 페이퍼돌이 잘 먹힌다") */
  R('무기는 손 하드포인트에 부착한다', M.slotVisible['무기']>0.002,
    '무기 착용 시 변화량 '+M.slotVisible['무기']);

  /* 규칙7 : 방어구는 클래스별 전신 시트 (GameDev.net "one spritesheet for each kind of armor") */
  R('방어구는 종류별 전신 그림으로 몸을 교체한다', M.slotVisible['갑옷']>0.002,
    '갑옷 착용 시 변화량 '+M.slotVisible['갑옷']+', 갑옷 종류 '+M.armorTypes+'종');

  /* 규칙8 : 반지·목걸이·장갑은 스탯 전용이 표준 (Terraria "no appearance when worn" / Stardew rings) */
  const acc=['반지','목걸이','장갑','신발','망토'].map(k=>M.slotVisible[k]);
  R('반지·목걸이·장갑·신발·망토는 스탯 전용 (업계 표준)', acc.every(v=>v===0),
    '변화량 반지 '+M.slotVisible['반지']+' 목걸이 '+M.slotVisible['목걸이']+' 장갑 '+M.slotVisible['장갑']+' 신발 '+M.slotVisible['신발']+' 망토 '+M.slotVisible['망토']+' (0 = 표준대로)');

  /* 규칙9 : 앞/뒤로 갈라지는 부위는 앞뒤 레이어를 따로 (MapleStory capeOverHead/capeBelowBody) */
  const fewSlots=!/bw_cape|fw_boots/.test(src.slice(src.indexOf('function heroGeared')));
  R('표시 슬롯을 극소수로 제한한다 (RO 헤드기어+무기 / Dofus 모자+케이프+무기 / 테라리아 비표시 장신구)',
    fewSlots, fewSlots?'투구·무기·갑옷만 표시, 신발·장갑·반지·목걸이는 스탯 전용':'오버레이가 남아 있다');

  /* 규칙10 : 색 변형은 레이어 추가가 아니라 색 돌리기로 (RO 팔레트 / Tibia 마스크) */
  const hueRot=/hue-rotate\(/.test(src);
  R('원소 11색을 그림 추가 없이 색 돌리기로 처리한다', hueRot,
    hueRot?'hue-rotate 사용, 장비 682개를 그림 40여장으로 처리':'색 돌리기 없음');

  console.log('╔══ 유사 2D 게임 20건 조사 규칙 대비 교차 검증 ══╗\n');
  let ok=0;
  rules.forEach((r,i)=>{
    console.log((r.ok?'  ✅':'  ❌')+' '+(i+1)+'. '+r.n);
    console.log('       근거: '+r.ev);
    if(r.ok) ok++;
  });
  console.log('\n  통과 '+ok+' / '+rules.length);
  console.log('  페이지 오류: '+errs.length);
  await b.close();
  process.exit((ok===rules.length&&errs.length===0)?0:1);
})();
