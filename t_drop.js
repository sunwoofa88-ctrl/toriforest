const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.beginPlay();});
await p.waitForTimeout(600);
const r=await p.evaluate(()=>{
  const T=window.__TORI;
  const out={};
  [1,25,50,80,110].forEach(ch=>{
    T.S.chap=ch-1;
    const N=20000; let eq=0, star=0;
    const g=new Array(6).fill(0);
    for(let i=0;i<N;i++){
      if(Math.random()<0.055){ eq++; g[T.EQUIP[T.rollEquipDrop(ch-1,false)].grade]++; }
      if(Math.random()<0.14) star++;
    }
    out['ch'+ch]={eqPct:+(eq/N*100).toFixed(2), starPct:+(star/N*100).toFixed(1),
      grade:g.map(x=>eq? +(x/eq*100).toFixed(1):0)};
  });
  // 보스
  const gb=new Array(6).fill(0);
  for(let i=0;i<5000;i++) gb[T.EQUIP[T.rollEquipDrop(89,true)].grade]++;
  out.boss=gb.map(x=>+(x/5000*100).toFixed(1));
  out.names=T.EQ_GRADE.map(x=>x.n);
  return out;
});
console.log('=== 장비 드랍 ===');
[1,25,50,80,110].forEach(ch=>{
  const d=r['ch'+ch];
  console.log(('  '+ch+'장').padEnd(8)+' 몬스터당 '+d.eqPct+'%   등급 '+r.names.map((n,i)=>n+' '+d.grade[i]+'%').join(' / '));
});
console.log('  보스     100%        등급 '+r.names.map((n,i)=>n+' '+r.boss[i]+'%').join(' / '));
console.log('  별조각   몬스터당 '+r['ch1'].starPct+'% (펫 보유 시 더 자주)');
await b.close();})();
