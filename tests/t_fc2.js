const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:800,height:1280},deviceScaleFactor:1.5});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
console.log(JSON.stringify(await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg;
  T.S.gachaBonus=400; for(let i=0;i<160;i++) T.doGacha();
  const fu = T.fuseUsable || D.fuseUsable;
  const G=T.PET_GRADE, BY=T.PET_BY_GRADE;
  const rows=[];
  for(let gr=0;gr<G.length;gr++){
    const pool=BY[gr]||[]; let owned=0,spare=0;
    for(const id of pool){ const c=fu?fu(id):-99; if(c>0) owned+=c; if(c>1) spare+=c-1; }
    rows.push({gr, owned, spare, can:Math.floor(spare/3)});
  }
  return {rows, cnt:D.petFuseCount(), petsN:Object.values(T.S.pets).reduce((a,c)=>a+c,0),
          slot:(T.S.petSlot||[]).length, hasFu:typeof fu};
}),null,0)); await b.close();})();
