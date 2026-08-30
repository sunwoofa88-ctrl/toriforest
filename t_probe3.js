const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1356,height:848}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI;
    /* ① 보스 체력 단조성 */
    const bosses=[];
    for(let ch=1; ch<=110; ch++){
      let bo=null; try{ bo=T.chapBoss(ch); }catch(e){}
      const sp=bo&&T.SPECIES[bo.id||bo];
      if(sp) bosses.push({ch, hp:sp.hp, id:(bo.id||bo)});
    }
    const drops=[];
    for(let i=1;i<bosses.length;i++)
      if(bosses[i].hp < bosses[i-1].hp*0.92) drops.push({ch:bosses[i].ch, from:bosses[i-1].hp, to:bosses[i].hp});
    /* ② 플레이어 성장 : 레벨별 공격력·체력 */
    const S=T.S, save={lv:S.lv, eqW:S.eqW, eqA:S.eqA};
    const grow=[];
    for(const lv of [1,10,20,30,40,50,60,70,80,90,100]){
      S.lv=lv;
      grow.push({lv, hp:T.dbg.maxHp(), atk:Math.round(T.dbg.baseAtk? T.dbg.baseAtk(): 0)});
    }
    S.lv=save.lv;
    /* ③ 몬스터 종류가 장마다 몇 개나 보이는가 */
    const cnt={};
    for(let ch=1; ch<=110; ch++){ let m=[]; try{ m=T.chapMobs(ch)||[]; }catch(e){}
      cnt[m.length]=(cnt[m.length]||0)+1; }
    return {bosses:bosses.length, drops, grow, mobCount:cnt};
  });
  console.log('보스 있는 장:', r.bosses);
  console.log('\n■ 보스 체력이 이전 보스보다 8% 넘게 약해지는 구간:', r.drops.length);
  for(const d of r.drops) console.log('   '+d.ch+'장: '+d.from+' → '+d.to+'  ('+Math.round((d.to/d.from-1)*100)+'%)');
  console.log('\n■ 레벨별 성장');
  console.log('  레벨   체력    공격');
  for(const g of r.grow) console.log('  '+String(g.lv).padStart(4), String(g.hp).padStart(6), String(g.atk).padStart(7));
  console.log('\n■ 장별 몬스터 종류 수 분포:', JSON.stringify(r.mobCount));
  await b.close();
})();
