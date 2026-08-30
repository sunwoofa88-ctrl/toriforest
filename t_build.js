const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
await p.waitForTimeout(900);
const r=await p.evaluate(()=>{
  const T=window.__TORI, out=[];
  for(const c of [0,15,35,55,75,95,105]){
    const t0=performance.now(); T.enterChapter(c); const t1=performance.now();
    out.push({c:c+1, ms:+(t1-t0).toFixed(1)});
  }
  return out;
});
console.log('장 전환(월드 생성+지형 페인팅+베이킹) 소요시간');
r.forEach(x=>console.log('  '+String(x.c).padStart(4)+'장   '+String(x.ms).padStart(7)+' ms'));
console.log('  평균 '+(r.reduce((a,x)=>a+x.ms,0)/r.length).toFixed(1)+' ms   최대 '+Math.max(...r.map(x=>x.ms)).toFixed(1)+' ms');
await b.close();})();
