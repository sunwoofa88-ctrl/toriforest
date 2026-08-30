const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();});
await p.waitForTimeout(600);
// 진행 상황 만들기
await p.evaluate(()=>{const T=window.__TORI;
  T.S.lv=33; T.S.acorn=54321; T.S.star=777; T.S.chap=12;
  for(let i=0;i<6;i++) T.giveEquip(T.rollEquipDrop(40,true));
  T.S.gachaBonus=6; for(let i=0;i<6;i++) T.doGacha();
});
await p.waitForTimeout(300);
const before=await p.evaluate(()=>{const T=window.__TORI;
  return {lv:T.S.lv,acorn:T.S.acorn,star:T.S.star,chap:T.S.chap,
    eq:Object.keys(T.S.eq).length, pets:Object.keys(T.S.pets).length, eqW:T.S.eqW, eqA:T.S.eqA};});

// ① 탭 숨김(홈버튼과 같은 상황)만으로 저장되는지 — saveGame 호출 없이 강제 종료
await p.evaluate(()=>{ Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
  document.dispatchEvent(new Event('visibilitychange')); });
await p.waitForTimeout(300);
const stored=await p.evaluate(()=>{ try{ return !!localStorage.getItem(Object.keys(localStorage).find(k=>k.indexOf('tori')>=0||k.indexOf('dotori')>=0)||''); }catch(e){ return 'err'; } });

// ② 페이지 완전히 새로 열기 → 이어지는지
await p.close();
const p2=await ctx.newPage();
await p2.goto('file:///root/toriforest/dotorisup.html');
await p2.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p2.waitForTimeout(400);
const after=await p2.evaluate(()=>{const T=window.__TORI;
  return {lv:T.S.lv,acorn:T.S.acorn,star:T.S.star,chap:T.S.chap,
    eq:Object.keys(T.S.eq||{}).length, pets:Object.keys(T.S.pets||{}).length, eqW:T.S.eqW, eqA:T.S.eqA};});
console.log('저장 전 :', JSON.stringify(before));
console.log('재실행 후:', JSON.stringify(after));
const same=JSON.stringify(before)===JSON.stringify(after);
console.log(same? '✅ 껐다 켜도 그대로 이어집니다' : '❌ 불일치');
// ③ pagehide 로도 저장되는지
await p2.evaluate(()=>{ window.__TORI.S.acorn=13579; window.dispatchEvent(new Event('pagehide')); });
await p2.waitForTimeout(250);
await p2.close();
const p3=await ctx.newPage();
await p3.goto('file:///root/toriforest/dotorisup.html');
await p3.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p3.waitForTimeout(300);
const a3=await p3.evaluate(()=>window.__TORI.S.acorn);
console.log(a3===13579? '✅ pagehide(앱 내려갈 때)에도 저장됩니다' : '❌ pagehide 저장 실패 ('+a3+')');
await b.close();})();
