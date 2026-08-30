const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1356,height:848}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, S=T.S;
    const save={lv:S.lv, chap:S.chap};
    const rows=[];
    /* 장 진행에 맞는 예상 레벨 = 장 수와 비슷하다고 보고 계산 */
    for(const ch of [1,10,20,30,40,50,60,70,80,90,100,110]){
      S.lv = Math.max(1, Math.round(ch*0.95));
      const atk = T.dbg.baseAtk? T.dbg.baseAtk() : 0;
      const hp  = T.dbg.maxHp();
      let mobs=[]; try{ mobs=T.chapMobs(ch)||[]; }catch(e){}
      let mhp=0,matk=0,n=0;
      for(const m of mobs){ const id=(typeof m==='string')?m:(m&&m.id); const sp=T.SPECIES[id];
        if(!sp) continue; mhp+=sp.hp; matk+=sp.atk; n++; }
      mhp=n?mhp/n:1; matk=n?matk/n:1;
      let bo=null; try{ bo=T.chapBoss(ch);}catch(e){}
      const bsp=bo&&T.SPECIES[bo.id||bo];
      rows.push({ch, 레벨:S.lv, 내공격:Math.round(atk), 내체력:hp,
        몹체력:Math.round(mhp), 몹타수:+(mhp/Math.max(1,atk)).toFixed(1),
        보스타수:bsp? +(bsp.hp/Math.max(1,atk)).toFixed(0):0,
        내가버티는타수:+(hp/Math.max(1,matk)).toFixed(0)});
    }
    S.lv=save.lv;
    return rows;
  });
  console.log('장   레벨  내공격  내체력  몹체력  몹처치타수  보스타수  내가버티는타수');
  for(const q of r) console.log(
    String(q.ch).padStart(3), String(q.레벨).padStart(5), String(q.내공격).padStart(7),
    String(q.내체력).padStart(7), String(q.몹체력).padStart(7),
    String(q.몹타수).padStart(10), String(q.보스타수).padStart(9), String(q.내가버티는타수).padStart(14));
  const t=r.map(q=>q.몹타수);
  console.log('\n몹 처치 타수 : 처음', t[0], '→ 끝', t[t.length-1], (t[t.length-1]<t[0]*0.7?'  ← 뒤로 갈수록 쉬워진다':''));
  const s=r.map(q=>q.내가버티는타수);
  console.log('내가 버티는 타수 : 처음', s[0], '→ 끝', s[s.length-1]);
  await b.close();
})();
