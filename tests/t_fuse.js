const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:800,height:1280},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))errs.push(m.text())});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
const r=await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg;
  T.S.gachaBonus=400; for(let i=0;i<160;i++) T.doGacha();
  const before=Object.keys(T.S.pets).length, beforeN=Object.values(T.S.pets).reduce((a,c)=>a+c,0);
  const cnt=D.fuseAllCount? D.fuseAllCount() : (window.fuseAllCount?fuseAllCount():-1);
  const res=D.fuseAllPets? D.fuseAllPets() : null;
  const after=Object.keys(T.S.pets).length, afterN=Object.values(T.S.pets).reduce((a,c)=>a+c,0);
  return {before, beforeN, cnt, n:res?res.n:-1, up:res?res.up:-1, after, afterN};
});
console.log(JSON.stringify(r));
console.log('ERR',errs.slice(0,3));
await b.close();})();
