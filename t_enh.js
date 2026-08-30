const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.beginPlay();});
await p.waitForTimeout(700);
const r=await p.evaluate(()=>{
  const T=window.__TORI;
  const id=T.EQ_WEP[0];
  T.S.eq={}; T.S.eq[id]=1; T.S.eqW=id; T.S.eqPlus={};
  const stat={ok:0,fail:0,brk:0,poor:0,max:0};
  const byLvl={};
  let broke=0, maxed=0;
  for(let trial=0; trial<4000; trial++){
    T.S.eq[id]=1; T.S.eqPlus[id]=0; T.S.eqW=id;
    let pl=0;
    while(pl<15){
      T.S.star=999999;
      const res=T.doEnhance(id);
      if(!res) break;
      if(res.r==='ok'){ pl=res.plus; }
      else if(res.r==='fail'){ /* 유지 */ }
      else if(res.r==='break'){ broke++; break; }
      else break;
      if(pl>=15){ maxed++; break; }
    }
    byLvl[pl]=(byLvl[pl]||0)+1;
  }
  // 확률 표 검증
  const odds=T.EQ_UP.map((o,i)=>({from:i, to:o[0], ok:o[1], brk:o[2], keep:100-o[1]-o[2]}));
  // 7강까지 절대 안 부서지는지
  let safe=true;
  T.S.eq[id]=1; T.S.eqPlus[id]=0;
  for(let t=0;t<3000;t++){
    T.S.eqPlus[id]=Math.floor(Math.random()*7); T.S.eq[id]=1; T.S.star=999999;
    const res=T.doEnhance(id);
    if(res && res.r==='break') safe=false;
  }
  // 오라 스프라이트가 강화도별로 다른지
  function hash(c){const g=c.getContext('2d');const d=g.getImageData(0,0,c.width,c.height).data;
    let h=0;for(let i=0;i<d.length;i+=53)h=(h*31+d[i])|0;return h;}
  const hs=new Set();
  for(let pl=0;pl<=15;pl++) hs.add(hash(T.eqSpr(id,110,pl)));
  return {broke, maxed, trials:4000, byLvl, odds, safe, distinctSprites:hs.size};
});
console.log('=== 강화 시스템 4000회 시뮬레이션 ===');
console.log('  +7 이하에서 파괴 발생: '+(r.safe? '없음 ✅' : '있음 ❌'));
console.log('  15강 도달 '+r.maxed+'회 ('+(r.maxed/r.trials*100).toFixed(1)+'%)   도중 파괴 '+r.broke+'회 ('+(r.broke/r.trials*100).toFixed(1)+'%)');
const lv=Object.keys(r.byLvl).map(Number).sort((a,b)=>a-b);
console.log('  최종 강화도 분포: '+lv.map(k=>'+'+k+':'+(r.byLvl[k]/r.trials*100).toFixed(1)+'%').join('  '));
console.log('  확률표 (8강 이상):');
r.odds.filter(o=>o.from>=7).forEach(o=>console.log('    +'+o.from+'→+'+o.to+'  성공 '+o.ok+'%  실패 '+o.keep+'%  파괴 '+o.brk+'%'));
console.log('  강화도별 스프라이트 종류: '+r.distinctSprites+' / 16 (전부 달라야 정상)');
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
