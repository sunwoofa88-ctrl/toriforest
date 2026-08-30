/* 실전 밸런스 : 실제 전투 루프로 '잡는 시간 / 죽는 시간' 을 잰다 */
const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
const r=await p.evaluate(()=>{
  const D=__TORI.dbg, S=__TORI.S;
  const need=l=>Math.round(32*Math.pow(l,1.72));
  const out=[]; let lv=1,xp=0;
  for(let c=0;c<110;c++){
    S.chap=c; S.lv=lv; S.tier={}; S.plus={};
    S.tier[S.abil]=Math.min(2,Math.floor(c/34));
    S.plus[S.abil]=Math.min(20,Math.floor(c*0.4));
    const keys=D.chapMobs(c);
    const hp=D.maxHp(), pd=D.abilDmg(S.abil);
    let die=0,kill=0,n=0;
    for(const k of keys){ const st=D.enemyStat(k,1);
      die+=hp/Math.max(1,st.atk); kill+=st.hp/Math.max(1,pd); n++; }
    const A0=D.ABIL[S.abil],t0=Math.min(2,Math.floor(c/34)); const dps0=(A0.dmg[t0]/A0.cd[t0])*(D.baseAtk()/10)*(1+S.plus[S.abil]*0.14);
    let bd=null,bk=null,bt=null;
    const isB=D.chapIsBoss(c), isM=D.chapIsMid(c);
    if(isB||isM){ const key=isB?D.chapBoss(c):D.chapMid(c);
      const bst=D.enemyStat(key,(isM?5.5:1)*2.0);
      bd=hp/Math.max(1,bst.atk); const A=D.ABIL[S.abil],t=Math.min(2,Math.floor(c/34)); const dps=(A.dmg[t]/A.cd[t])*(D.baseAtk()/10)*(1+S.plus[S.abil]*0.14); bk=bst.hp/Math.max(1,pd); bt=bst.hp/dps; }
    let ksec=0; for(const k of keys){ ksec+=D.enemyStat(k,1).hp/dps0; } ksec/=n;
    out.push({c,lv,ksec:+ksec.toFixed(2),die:+(die/n).toFixed(1),kill:+(kill/n).toFixed(1),
      bd:bd?+bd.toFixed(1):null, bs:bt?Math.round(bt):null, isB});
    const killN=24+(c%10)*4+Math.floor(c/10)*6;
    let g=0; for(let i=0;i<killN;i++){ g+=D.SPECIES[keys[i%keys.length]].xp*(1+c*0.42); }
    xp+=g; while(xp>=need(lv)){ xp-=need(lv); lv++; }
  }
  return out;
});
console.log('장   레벨  맞아죽기  때려잡기   보스(맞기 / 초)');
for(const o of r) if(o.c%7===0||o.bd) console.log(String(o.c+1).padStart(3),String(o.lv).padStart(5),
  String(o.die).padStart(8),(o.ksec+'초').padStart(9), o.bd?`   ${o.bd}대 / ${o.bs}초 ${o.isB?'★대장':'중간'}`:'');
const q=(a,f)=>{const s=a.slice().sort((x,y)=>x-y);return s[Math.floor(s.length*f)];};
const d=r.map(o=>o.die),k=r.map(o=>o.ksec);
console.log(`\n맞아죽기 : 중앙 ${q(d,.5)} · 범위 ${Math.min(...d).toFixed(1)}~${Math.max(...d).toFixed(1)}`);
console.log(`잡는시간 : 중앙 ${q(k,.5)} · 범위 ${Math.min(...k).toFixed(1)}~${Math.max(...k).toFixed(1)}`);
const bs=r.filter(o=>o.bs).map(o=>o.bs);
console.log(`보스전   : 중앙 ${q(bs,.5)}초 · 범위 ${Math.min(...bs)}~${Math.max(...bs)}초`);
await b.close();})();
