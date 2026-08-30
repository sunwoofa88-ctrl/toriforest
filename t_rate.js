const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'});
const p=await ctx.newPage(); p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
const cdp=await ctx.newCDPSession(p);
const T=async(t,pts)=>cdp.send('Input.dispatchTouchEvent',{type:t,touchPoints:pts.map((q,i)=>({x:q.x,y:q.y,id:i+1}))});
await p.click('#tapstart'); await p.waitForTimeout(900);
const q=await p.evaluate(()=>{const r=document.getElementById('btnAtk').getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2};});
const ids=await p.evaluate(()=>Object.keys(window.__TORI.ABIL));
let bad=[],rows=[];
for(const a of ids){
  const cd=await p.evaluate(id=>{const G=window.__TORI;
    G.S.abil=id;G.S.owned[id]=1;G.S.prog={};G.S.lv=30;G.enterChapter(0);
    for(let i=0;i<4;i++) G.spawnEnemy();
    return G.ABIL[id].cd[0];},a);
  await p.waitForTimeout(500);
  const n0=await p.evaluate(()=>window.__TORI.dbg.atkN());
  await T('touchStart',[q]); await p.waitForTimeout(4000); await T('touchEnd',[q]);
  const n1=await p.evaluate(()=>window.__TORI.dbg.atkN());
  const rate=(n1-n0)/4;
  rows.push({a,cd:+cd.toFixed(2),rate:+rate.toFixed(1)});
  if(rate<3.0) bad.push({a,cd:+cd.toFixed(2),rate:+rate.toFixed(1)});
  await p.waitForTimeout(200);
}
rows.sort((x,y)=>x.rate-y.rate);
console.log('가장 느린 8개:');
rows.slice(0,8).forEach(r=>console.log('  '+r.a.padEnd(15)+String(r.cd).padStart(6)+'s → '+String(r.rate).padStart(5)+'회/초'));
console.log('\n능력 '+ids.length+'개 중 초당 3.0회 미만: '+bad.length+'개');
console.log(p.__errs.length? 'ERR '+p.__errs.slice(0,2).join('|') : '에러 없음');
await b.close();
process.exit(bad.length?1:0);})();
