const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))errs.push(m.text())});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(700);
// 보스 장으로
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.S.chap=9;T.enterChapter(9);});
await p.waitForTimeout(600);
await p.evaluate(()=>{const T=window.__TORI;
  T.dbg.addKills(999);
  const A=T.dbg.arena; if(A){T.P.x=A.x; T.P.y=A.y;}});
await p.waitForTimeout(1500);
let info=await p.evaluate(()=>{const T=window.__TORI;
  const b=T.EN.filter(e=>e.alive&&e.big);
  return b.map(e=>({key:e.key,hp:Math.round(e.hp),max:Math.round(e.hpMax),atk:e.atk,poise:e.poise,pm:e.poiseMax,ph:e.ph3}));});
console.log('보스:',JSON.stringify(info));
// 보스에게 반복 타격 → 그로기 확인
const res=await p.evaluate(async()=>{const T=window.__TORI;
  const e=T.EN.find(x=>x.alive&&x.big); if(!e) return {err:'no boss'};
  let brk=0, ph=[];
  const t0=performance.now();
  for(let i=0;i<400;i++){
    T.dbg.hurtEnemy(e, e.hpMax*0.006, i%7===0, 0, 0, 1, 0);
    if(e.groggy>0 && !brk){ brk=i; }
    if(!ph.includes(e.ph3)) ph.push(e.ph3);
    await new Promise(r=>setTimeout(r,4));
    if(e.dead) break;
  }
  return {brk, ph, dead:!!e.dead, hp:Math.round(e.hp), groggy:+e.groggy.toFixed(2)};});
console.log('타격 결과:',JSON.stringify(res));
await p.screenshot({path:'/root/toriforest/BOSS.png'});
console.log('ERR', errs.slice(0,4));
await b.close();})();
