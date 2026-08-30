/* 난이도 밸런스 실측 : 장(章)마다 '몇 대 맞으면 죽는지 / 몇 대 때리면 잡는지' */
const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
const r=await p.evaluate(()=>{
  const T=window.__TORI.dbg, S=window.__TORI.S;
  
  // 정직하게 경험치를 누적해 레벨 곡선을 만든다
  const out=[];
  let lv=1, xp=0;
  const need=l=>Math.round(32*Math.pow(l,1.72));
  for(let c=0;c<110;c++){
    S.chap=c; S.lv=lv;
    S.tier={}; S.plus={};
    // 능력 티어는 장 진행에 맞춰 오른다고 가정
    const tier=Math.min(3,Math.floor(c/28));
    S.tier[S.abil]=tier; S.plus[S.abil]=Math.min(20,Math.floor(c*0.5));
    const mobs=T.chapMobs?T.chapMobs(c):null;
    const keys=mobs||Object.keys(T.SPECIES).slice(0,3);
    const hp=T.maxHp?T.maxHp():(100+(lv-1)*15);
    let sumHitsToDie=0, sumHitsToKill=0, n=0;
    for(const k of keys){
      const st=T.enemyStat(k,1);
      const pdmg=T.abilDmg(S.abil);
      sumHitsToDie += hp/Math.max(1,st.atk);
      sumHitsToKill += st.hp/Math.max(1,pdmg);
      n++;
    }
    // 보스
    const bk=T.chapIsBoss(c)? (T.chapBoss?T.chapBoss(c):null) : (T.chapIsMid(c)? (T.chapMid?T.chapMid(c):null):null);
    let bossHits=null, bossKill=null;
    if(bk){ const bst=T.enemyStat(bk, (T.chapIsMid(c)?5.5:1)*2.0);
      bossHits=hp/Math.max(1,bst.atk); bossKill=bst.hp/Math.max(1,T.abilDmg(S.abil)); }
    out.push({c, lv, hp, die:+(sumHitsToDie/n).toFixed(1), kill:+(sumHitsToKill/n).toFixed(1),
              bd:bossHits?+bossHits.toFixed(1):null, bk:bossKill?+bossKill.toFixed(1):null});
    // 이 장을 클리어하며 얻는 경험치
    const killN=24+(c%10)*4+Math.floor(c/10)*6;
    for(const k of keys){ }
    let gain=0;
    for(let i=0;i<killN;i++){ const k=keys[i%keys.length]; gain += T.SPECIES[k].xp*(1+c*0.42); }
    xp+=gain;
    while(xp>=need(lv)){ xp-=need(lv); lv++; }
  }
  return out;
});
console.log('장   레벨   HP     맞아죽기  때려잡기   보스(맞기/잡기)');
for(const o of r){ if(o.c%5===0||o.bd) console.log(
  String(o.c+1).padStart(3), String(o.lv).padStart(5), String(o.hp).padStart(7),
  String(o.die).padStart(8), String(o.kill).padStart(9),
  o.bd? `   ${o.bd} / ${o.bk}`:''); }
const dies=r.map(o=>o.die), kills=r.map(o=>o.kill);
const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
console.log(`\n중앙값 : 맞아죽기 ${med(dies)}대 · 때려잡기 ${med(kills)}대`);
console.log(`범위   : 맞아죽기 ${Math.min(...dies).toFixed(1)}~${Math.max(...dies).toFixed(1)} · 때려잡기 ${Math.min(...kills).toFixed(1)}~${Math.max(...kills).toFixed(1)}`);
await b.close();})();
