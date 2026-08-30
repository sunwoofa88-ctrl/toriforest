/* 장비를 갖춘 실제 상황의 전투 길이 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1356,height:848}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, S=T.S, D=T.dbg;
    /* 실제 DPS = 능력 위력/쿨 × 레벨계수 × 장비공격 × 강화 (제곱근 아님) */
    function realDps(){
      const a=S.abil, A=T.ABIL[a]; if(!A) return 50;
      const t=D.abilTier? D.abilTier(a):0;
      const d=A.dmg[t]||A.dmg[0], c=A.cd[t]||A.cd[0];
      const up=(1+(D.abilPlus?D.abilPlus(a):0)*0.14)*(1+(T.eqB().atk||0)*0.55);
      return (d/c)*(10+(S.lv-1)*1.9)/10*up;
    }
    const rows=[];
    const grades=[0,0,1,1,2,2,3,3,4,4,5,5];
    let gi=0;
    for(const ch of [0,9,19,29,39,49,59,69,79,89,99,109]){
      S.chap=ch; S.lv=Math.max(1,Math.round((ch+1)*0.95));
      /* 그 시점에 어울리는 등급 장비를 채운다 */
      const g=grades[gi++];
      S.eq={}; if(S.eqOn) S.eqOn={};
      for(const id of T.EQ_IDS){ const E=T.EQUIP[id]; if(!E||E.grade!==g) continue;
        if(S.eq[E.slot]!==undefined||(E.slot===0&&S.eqW)||(E.slot===1&&S.eqA)) continue;
        T.giveEquip(id);
        if(E.slot===0) S.eqW=id; else if(E.slot===1) S.eqA=id; else S.eq[E.slot]=id;
        if(S.eqOn) S.eqOn[E.slot]=id; }
      const dps=realDps(), myHp=D.maxHp();
      let mobs=[]; try{ mobs=T.chapMobs(ch)||[]; }catch(e){}
      const nid=(typeof mobs[0]==='string')?mobs[0]:(mobs[0]&&mobs[0].id);
      let bo=null; try{ bo=T.chapBoss(ch);}catch(e){}
      const bid=(bo&&(bo.id||bo));
      const ns=nid?D.enemyStat(nid,1):null, bs=bid?D.enemyStat(bid,1):null;
      rows.push({장:ch+1, 등급:['일반','희귀','영웅','유니크','전설','신화'][g],
        실DPS:Math.round(dps), 몹처치초:ns?+(ns.hp/dps).toFixed(1):0,
        보스초:bs?Math.round(bs.hp/dps):0,
        보스분:bs?+(bs.hp/dps/60).toFixed(1):0,
        버팀:ns?Math.round(myHp/ns.atk):0,
        클리어필요:D.chapKillNeed(ch)});
    }
    return rows;
  });
  console.log('장   장비등급  실DPS  몹처치초  보스초  보스분  버티는대수  클리어필요마리  일반몹총시간(분)');
  for(const q of r) console.log(
    String(q.장).padStart(3), String(q.등급).padStart(7), String(q.실DPS).padStart(7),
    String(q.몹처치초).padStart(8), String(q.보스초).padStart(8), String(q.보스분).padStart(7),
    String(q.버팀).padStart(10), String(q.클리어필요).padStart(14),
    String((q.몹처치초*q.클리어필요/60).toFixed(1)).padStart(16));
  await b.close();
})();
