const {chromium}=require('playwright');
let pass=0,fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text())){const t=m.text().slice(0,120);if(errs.indexOf(t)<0)errs.push(t)}});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
await p.waitForTimeout(700);

// ── 1장 완주 (실제 조이스틱) ──
const SX=100,SY=640;
await p.mouse.move(SX,SY); await p.mouse.down();
let cleared=false;
for(let i=0;i<1400;i++){
  const r=await p.evaluate(()=>{
    const T=window.__TORI,P=T.P,pg=T.S.prog[''+T.S.chap]||{kills:0,boss:0};
    P.invT=9;
    let e=null,bd=1e9;
    for(const x of T.EN){if(!x.alive||x.dead)continue;const d=Math.hypot(x.x-P.x,x.y-P.y);if(d<bd){bd=d;e=x;}}
    let tx,ty;
    const need=T.chapKillNeed(T.S.chap);
    if(pg.kills>=need){ const g=pg.boss? T.WD.exitGate : (T.chapIsBoss(T.S.chap)? T.WD.arena : T.WD.exitGate); tx=g.x; ty=g.y; }
    else if(e&&bd<900){tx=e.x;ty=e.y;}
    else{let best=null,cd=1e9;for(const c of T.WD.camps){const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<cd){cd=d;best=c;}}tx=best.x;ty=best.y;}
    if(e&&bd<Math.max(180,T.ABIL[T.S.abil].range[0])) T.doAttack(e.x,e.y);
    if(T.S.ult>=100) T.doUlt();
    const dx=tx-P.x,dy=ty-P.y,d=Math.hypot(dx,dy)||1;
    return {chap:T.S.chap,kills:pg.kills,need:need,boss:pg.boss,ux:dx/d,uy:dy/d,stop:(e&&bd<110&&pg.kills<need)?1:0,owned:Object.keys(T.S.owned).length};
  });
  if(r.chap>=1&&r.kills>=3){cleared=true;break;}
  if(r.stop) await p.mouse.move(SX,SY);
  else await p.mouse.move(SX+r.ux*46, SY+r.uy*46);
  await p.waitForTimeout(38);
}
await p.mouse.up();
const st=await p.evaluate(()=>{const S=window.__TORI.S;return{chap:S.chap,lv:S.lv,owned:Object.keys(S.owned).length,
  cards:Object.keys(S.cards).length,mats:Object.keys(S.mat).length,acorn:S.acorn,star:S.star,
  codex:Object.keys(S.codex).length, prog:Object.keys(S.prog).length};});
ok('1장→3장 진행 완료', cleared, JSON.stringify(st));
ok('능력 획득(흡입/기본)', st.owned>=1, 'owned='+st.owned);
ok('재료 수집', st.mats>=1, 'mats='+st.mats);
ok('도감 등록', st.codex>=1, 'codex='+st.codex);
await p.screenshot({path:'F3_play.png'});

// 진화/강화 실행
await p.evaluate(()=>{const T=window.__TORI,S=T.S;
  S.acorn=9e6;S.star=9999;
  T.MAT_IDS.forEach(m=>S.mat[m]=40);
  Object.keys(T.ABIL).forEach(a=>{S.owned[a]=1;S.cards[a]=20;});});
await p.evaluate(()=>window.__TORI.openSheet('make',1)); await p.waitForTimeout(500);
let evo=0;
for(let i=0;i<8;i++){ const did=await p.evaluate(()=>{const bn=document.querySelector('.bigbtn.mag:not([disabled])');if(bn){bn.click();return true;}return false;});
  if(!did)break; evo++; await p.waitForTimeout(400); }
await p.evaluate(()=>window.__TORI.closeSheet()); await p.waitForTimeout(300);
ok('능력 진화 동작', evo>0, evo+'회');
await p.evaluate(()=>window.__TORI.openSheet('make',2)); await p.waitForTimeout(400);
let up=0;
for(let i=0;i<8;i++){ await p.waitForTimeout(280);
  const did=await p.evaluate(()=>{const bn=document.querySelector('.bigbtn.alt:not([disabled])');if(bn){bn.click();return true;}return false;});
  if(!did)break; up++; await p.waitForTimeout(520); }
await p.evaluate(()=>window.__TORI.closeSheet()); await p.waitForTimeout(300);
ok('능력 강화 동작', up>0, up+'회');
await p.evaluate(()=>window.__TORI.openSheet('make',0)); await p.waitForTimeout(400);
const fused=await p.evaluate(()=>{const c=document.querySelector('.sheet-bd .cell:not(.locked)');if(c){c.click();return true;}return false;});
await p.waitForTimeout(400);
await p.evaluate(()=>window.__TORI.closeSheet());
ok('재료 합성 동작', fused);
const fin=await p.evaluate(()=>{const S=window.__TORI.S;
  let t=0,pl=0; Object.keys(S.tier).forEach(k=>t+=S.tier[k]); Object.keys(S.plus).forEach(k=>pl+=S.plus[k]);
  return {tierSum:t,plusSum:pl};});
ok('진화/강화가 상태에 반영', fin.tierSum>0&&fin.plusSum>0, JSON.stringify(fin));
console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'  ✅ 에러 없음');
if(!errs.length) pass++; else fail++;
console.log(`\n═══ 통과 ${pass} / 실패 ${fail} ═══`);
await b.close();
})();
