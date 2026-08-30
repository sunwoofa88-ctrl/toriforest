const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html', KEY='toriforest_save_v5';
const CASES=[
  ['chap 99999',  '{"chap":99999}'],
  ['chap 1e308',  '{"chap":1e308}'],
  ['lv 1e308',    '{"lv":1e308}'],
  ['xp 1e308',    '{"xp":1e308}'],
  ['acorn 1e308', '{"acorn":1e308}'],
  ['lv 1e6',      '{"lv":1000000}'],
  ['chap 500',    '{"chap":500}'],
];
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 for(const [nm,val] of CASES){
  const p=await b.newPage({viewport:{width:800,height:480},deviceScaleFactor:1});
  await p.addInitScript(([k,v])=>{try{localStorage.setItem(k,v);}catch(e){}},[KEY,val]);
  let res='?';
  try{
    await p.goto(F,{timeout:18000});
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:18000});
    await p.evaluate(()=>window.__TORI.beginPlay(),{timeout:8000});
    await p.waitForTimeout(1500);
    const st=await p.evaluate(()=>({f:window.__TORI.dbg.frameCount(), lv:window.__TORI.S.lv, chap:window.__TORI.S.chap}));
    res = st.f>10? `✅ 정상 (lv=${st.lv} chap=${st.chap} 프레임 ${st.f})` : `❌ 멈춤 (프레임 ${st.f})`;
  }catch(e){ res='❌ 행/타임아웃 — '+String(e.message).split('\n')[0].slice(0,60); }
  console.log(nm.padEnd(14)+res);
  await p.close().catch(()=>{});
 }
 await b.close();
})();
