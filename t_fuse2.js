const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.beginPlay();});
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{
  const T=window.__TORI;
  // 1티어 재료를 잔뜩 주고 일괄 합치기
  T.S.mat={};
  T.TIER_POOL[1].forEach(m=>T.S.mat[m]=27);
  const before=Object.values(T.S.mat).reduce((a,c)=>a+c,0);
  const can=T.fuseAllCount();
  const res=T.fuseAllMats();
  const after={};
  for(let t=1;t<=4;t++){ after['t'+t]=T.TIER_POOL[t].reduce((a,m)=>a+(T.S.mat[m]|0),0); }
  const left1=T.TIER_POOL[1].filter(m=>(T.S.mat[m]|0)>=3).length;
  // 총 가치 보존 검증 : 3개 → 1개 이므로 t1 27개 = t2 9개 = t3 3개 = t4 1개
  return {before, can, made:res.total, after, left1,
    remainCan:T.fuseAllCount()};
});
console.log('=== 재료 일괄 합치기 ===');
console.log('  합치기 전 1티어 총 '+r.before+'개, 가능 횟수 '+r.can);
console.log('  실제 합친 횟수 '+r.made);
console.log('  결과 : '+JSON.stringify(r.after));
console.log('  1티어에 3개 이상 남은 종류 '+r.left1+'개 (0 이어야 정상)');
console.log('  남은 합치기 가능 횟수 '+r.remainCan+' (0 이어야 정상)');
// UI
const ui=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.TIER_POOL[1].forEach(m=>T.S.mat[m]=9);
  T.openSheet('make',0);
  await new Promise(r=>setTimeout(r,320));
  const bd=document.getElementById('sheetBody');
  const btn=bd.querySelector('.bestbtn');
  const txt=btn? btn.textContent:'없음';
  if(btn) btn.click();
  await new Promise(r=>setTimeout(r,320));
  return {btn:txt, after:bd.querySelector('.bestbtn')? bd.querySelector('.bestbtn').textContent:'없음'};
});
console.log('  버튼: "'+ui.btn+'" → 누른 뒤 "'+ui.after+'"');
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
