/* 게임의 모든 그림이 '최신 AI 원본'으로 적용됐는지 런타임 전수 확인.
   게임 자신의 키 규칙(SPECIES 키 · EQ_ART_MAP · PROP_ART)을 그대로 써서 확인한다. */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);

  const r=await p.evaluate(()=>{
    const T=window.__TORI, A=T.artOf, SRC=T.ART_SRC;
    const res={cat:{}, miss:{}, artKeysUsed:new Set()};
    function chk(cat,label,key){
      res.cat[cat]=res.cat[cat]||{n:0,ok:0};
      res.cat[cat].n++;
      if(key && A(key)){ res.cat[cat].ok++; res.artKeysUsed.add(key); }
      else (res.miss[cat]=res.miss[cat]||[]).push(label+(key?' ['+key+']':''));
    }
    /* ① 주인공 상태 · ② 갑옷 등급별 전신 */
    ['idle','move','atk','hurt','ko','blink','inhale'].forEach(k=>chk('주인공','hero_'+k,'hero_'+k));
    ['light','plate','mage','scale','royal','dark'].forEach(c=>chk('갑옷전신',c,'heroW_'+c));
    /* ③ 몬스터·보스 : SPECIES 전체 (키가 곧 그림 키) */
    const SP=T.SPECIES;
    for(const k in SP) chk(SP[k].boss?'보스':'몬스터', k, k);
    /* ④ 장비 : EQ_ART_MAP 을 통한 실제 해석 (dbg.artKey) */
    for(const id of T.EQ_IDS){ const key=T.dbg.artKey(id);
      chk('장비', id, (key&&key!=='none'&&key!=='?')?key:null); }
    /* ⑤ 소품 */
    const PA={tree:'pr_tree',pine:'pr_pine',rock:'pr_rock',bush:'pr_bush',house:'pr_house',
              cottage:'pr_house',chest:'pr_chest',campfire:'pr_fire',fire:'pr_fire',well:'pr_well'};
    for(const k in PA) chk('소품', k, PA[k]);
    /* ⑥ 이펙트 그림 : 소스에 fxArt('키') 로 박혀 있는 것 전부 */
    ['fx_slash','fx_ringw','fx_boom','fx_star'].forEach(k=>{ if(SRC[k]) chk('이펙트그림',k,k); });
    /* ⑥-b 착용 레이어 (계산 없이 겹치는 그림) */
    ['hw_cap','hw_helm','hw_horn','hw_hood','hw_mask','hw_crown']
      .forEach(k=>chk('착용레이어',k,k));
    /* 갑옷 칸 아이콘 (armorClassIcon 이 쓴다) */
    ['am_light','am_plate','am_mage','am_scale','am_royal','am_dark']
      .forEach(k=>chk('갑옷아이콘',k,k));
    ['rabbit','cat','dog','chick','fox','squirrel','panda','otter','penguin','alpaca','hamster','hedgehog',
     'owl','mole','turtle','deer','raccoon','seal','parrot','unicorn','koala','bearcub','chipmunk','chinchilla',
     'meerkat','wallaby','sloth','duck','owl2','lynx','ferret','seaotter','arcticfox','dragon','phoenix','spirit',
     'dokkaebi','ninetail','haetae','wolf'].forEach(k=>chk('펫동물','pet_'+k,'pet_'+k));
    /* ⑦ art/ 에 있는데 아무도 안 쓰는 그림 */
    const unused=[]; for(const k in SRC) if(!res.artKeysUsed.has(k)) unused.push(k);
    const o={cat:res.cat, miss:res.miss, unused, srcN:Object.keys(SRC).length};
    return o;
  });

  console.log('── 그림 적용 전수 확인 (art/ 총 '+r.srcN+'장) ──');
  let bad=0, tn=0, to=0;
  for(const c in r.cat){ const v=r.cat[c]; tn+=v.n; to+=v.ok;
    const m=(r.miss[c]||[]).length; if(m) bad+=m;
    console.log(`${c.padEnd(9)} ${String(v.ok).padStart(4)}/${String(v.n).padEnd(4)} (${(v.ok/v.n*100).toFixed(1)}%)`+(m?`   AI그림 없음 ${m}개`:'   전부 AI그림'));
  }
  console.log(`합계        ${to}/${tn}`);
  for(const c in r.miss){
    const L=r.miss[c];
    console.log(`\n[${c}] AI그림 없이 절차적으로 그려지는 항목 ${L.length}개:`);
    console.log('  '+L.slice(0,30).join(', ')+(L.length>30?` ... 외 ${L.length-30}개`:''));
  }
  console.log('\n[art/ 에 있으나 게임이 안 쓰는 그림] '+r.unused.length+'개');
  if(r.unused.length) console.log('  '+r.unused.join(', '));
  console.log('\n오류:',errs.length);
  await b.close(); process.exit(0);
})();
