/* 실제 스폰되는 값(enemyStat)으로 밸런스를 잰다 — SPECIES 표가 아니다 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1356,height:848}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, S=T.S, D=T.dbg;
    const save={lv:S.lv, chap:S.chap};
    const rows=[];
    for(const ch of [0,9,19,29,39,49,59,69,79,89,99,109]){
      S.chap=ch; S.lv=Math.max(1,Math.round((ch+1)*0.95));
      const dps=D.refDps? D.refDps() : null;
      const myHp=D.maxHp();
      let mobs=[]; try{ mobs=T.chapMobs(ch)||[]; }catch(e){}
      const norm=mobs[0]; const nid=(typeof norm==='string')?norm:(norm&&norm.id);
      let bo=null; try{ bo=T.chapBoss(ch);}catch(e){}
      const bid=(bo&&(bo.id||bo));
      const ns = nid? D.enemyStat(nid,1) : null;
      const bs = bid? D.enemyStat(bid,1) : null;
      rows.push({장:ch+1, 레벨:S.lv, 내DPS:dps?Math.round(dps):-1, 내체력:myHp,
        몹체력:ns?ns.hp:0, 몹공격:ns?ns.atk:0,
        몹처치초:(ns&&dps)? +(ns.hp/dps).toFixed(1):0,
        내가버티는대수:(ns)? Math.round(myHp/ns.atk):0,
        보스체력:bs?bs.hp:0, 보스처치초:(bs&&dps)? Math.round(bs.hp/dps):0,
        보스에버티는대수:(bs)? Math.round(myHp/bs.atk):0});
    }
    S.lv=save.lv; S.chap=save.chap;
    return rows;
  });
  console.log('장   레벨   내DPS  내체력  몹체력 몹공격 몹처치초 버티는대수  보스체력 보스처치초 보스버팀');
  for(const q of r) console.log(
    String(q.장).padStart(3), String(q.레벨).padStart(5), String(q.내DPS).padStart(7),
    String(q.내체력).padStart(7), String(q.몹체력).padStart(7), String(q.몹공격).padStart(6),
    String(q.몹처치초).padStart(8), String(q.내가버티는대수).padStart(10),
    String(q.보스체력).padStart(9), String(q.보스처치초).padStart(10), String(q.보스에버티는대수).padStart(8));
  const k=r.map(q=>q.몹처치초), bb=r.map(q=>q.보스처치초), d=r.map(q=>q.내가버티는대수);
  console.log('\n몹 처치 시간:', k[0]+'초 → '+k[k.length-1]+'초');
  console.log('보스 처치 시간:', bb[0]+'초 → '+bb[bb.length-1]+'초');
  console.log('일반몹에 버티는 대수:', d[0]+' → '+d[d.length-1]);
  await b.close();
})();
