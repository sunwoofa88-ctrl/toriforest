/* 종류가 많고 개수가 1마리씩인 상황(사용자 화면)에서도 일괄 조합이 되는지 */
const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:800,height:1280},deviceScaleFactor:1.5});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
const r=await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg;
  T.beginPlay();
  /* 사용자 상황 재현 : 일반 1종 1마리 + 희귀 여러 종 각 1마리 */
  T.S.pets={};
  const g0=T.PET_BY_GRADE[0], g1=T.PET_BY_GRADE[1];
  T.S.pets[g0[0]]=1;
  for(let i=0;i<7;i++) T.S.pets[g1[i]]=1;
  T.S.petSlot=[g1[0],g1[1],g1[2]];
  const before=Object.values(T.S.pets).reduce((a,c)=>a+c,0);
  const cnt=D.petFuseCount();
  const res=D.fuseAllPets();
  const after=Object.values(T.S.pets).reduce((a,c)=>a+c,0);
  return {before, cnt, n:res.n, up:res.up, after, slotKept:T.S.petSlot.every(k=>(T.S.pets[k]|0)>0)};
});
console.log(JSON.stringify(r));
console.log('ERR',errs.slice(0,2));
await b.close();})();
