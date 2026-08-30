const {chromium}=require('playwright');
/* 게임 전 기능 전수 오류 조사 */
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[], warns=[];
p.on('pageerror',e=>{const m=e.message; if(errs.indexOf(m)<0)errs.push(m);});
p.on('console',m=>{ if(m.type()==='error'){const t=m.text(); if(t.indexOf('ERR_')<0&&warns.indexOf(t)<0)warns.push(t);} });
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
const step=async(name,fn)=>{ const n0=errs.length;
  try{ await p.evaluate(fn); }catch(e){ errs.push(name+': '+String(e).slice(0,90)); }
  await p.waitForTimeout(140);
  if(errs.length>n0) console.log('  ❌ '+name+' → '+errs[errs.length-1].slice(0,80));
};
console.log('=== 전 기능 오류 조사 ===');
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.S.acorn=99999999;T.S.star=99999;T.beginPlay();});
await p.waitForTimeout(700);

await step('장비 대량 지급', ()=>{const T=window.__TORI; for(let i=0;i<80;i++) T.giveEquip(T.rollEquipDrop(70,true));});
await step('펫 대량 뽑기', ()=>{const T=window.__TORI; T.S.gachaBonus=200; for(let i=0;i<120;i++) T.doGacha();});
await step('재료 지급+일괄합성', ()=>{const T=window.__TORI; T.TIER_POOL[1].forEach(m=>T.S.mat[m]=30); T.fuseAllMats();});
await step('전 장비 착용 순회', ()=>{const T=window.__TORI;
  Object.keys(T.S.eq).forEach(id=>{ if(T.EQUIP[id].slot===0) T.S.eqW=id; else T.S.eqA=id; });
  T.refreshHeroArt();});
await step('강화 반복', ()=>{const T=window.__TORI;
  for(let i=0;i<300;i++){ T.S.star=99999; const id=T.S.eqW; if(!id||!T.S.eq[id]) break; T.doEnhance(id); }});
await step('펫 조합 반복', ()=>{const T=window.__TORI;
  for(let g=0;g<6;g++) for(let t=0;t<12;t++){
    const pick=[]; for(const id of T.PET_BY_GRADE[g]){ let u=T.fuseUsable(id); while(u-->0&&pick.length<3) pick.push(id); if(pick.length>=3)break; }
    if(pick.length<3) break; T.doPetFuse(pick); }});
await step('전 능력 순회+공격', ()=>{const T=window.__TORI;
  Object.keys(T.ABIL).forEach(a=>{ T.S.owned[a]=1; T.S.abil=a; T.doAttack(T.P.x+150,T.P.y); });});
await step('필살기 전 무기', ()=>{const T=window.__TORI;
  T.WEP_TYPE.forEach((w,i)=>{ const id=T.EQ_WEP.find(x=>T.EQUIP[x].tn===i); T.S.eq[id]=1; T.S.eqW=id;
    T.S.ult=100; T.doUlt(); });});
await step('전 챕터 순회', ()=>{const T=window.__TORI; for(let c=0;c<110;c++) T.enterChapter(c);});
await step('보스 소환·처치', ()=>{const T=window.__TORI;
  for(const c of [9,29,59,109]){ T.enterChapter(c);
    const bk=T.chapBoss(c); const e=T.spawnEnemy(bk); e.hp=1; }});
await step('상자 열기', ()=>{const T=window.__TORI; T.enterChapter(3);
  T.WD.chests.forEach(c=>{ T.P.x=c.x; T.P.y=c.y; });});
await step('사망·부활', ()=>{const T=window.__TORI; T.P.invT=0; for(let i=0;i<40;i++) T.hurtPlayer? T.hurtPlayer(99999):0;});
for(const [s,n] of [['bag',2],['gear',3],['pet',3],['make',3],['book',3],['map',1]]){
  for(let t=0;t<n;t++){
    await step('시트 '+s+t, new Function('const T=window.__TORI;T.openSheet("'+s+'",'+t+');'));
  }
}
await step('시트 닫기', ()=>window.__TORI.closeSheet());
await step('초기화', ()=>{const T=window.__TORI; T.openSheet('map',0);});
await p.evaluate(()=>{document.getElementById('btnReset').click();});
await p.waitForTimeout(300);
await p.evaluate(()=>{const y=document.querySelector('.mb-yes'); if(y) y.click();});
await p.waitForTimeout(1200);
await step('초기화 후 플레이', ()=>{const T=window.__TORI; T.doAttack(T.P.x+100,T.P.y); T.S.ult=100; T.doUlt();});
// 회전
await p.setViewportSize({width:846,height:412}); await p.waitForTimeout(600);
await step('가로전환 후 공격', ()=>{const T=window.__TORI; T.doAttack(T.P.x+100,T.P.y);});
await p.setViewportSize({width:412,height:846}); await p.waitForTimeout(600);
const mini=await p.evaluate(()=>{
  const T=window.__TORI;
  return {miniDrawn: typeof T.WD.mini!=='undefined'};
});
console.log('  미니맵 화면 표시 제거됨 (지도 화면용 데이터는 유지: '+mini.miniDrawn+')');
console.log('');
console.log(errs.length? ('❌ 오류 '+errs.length+'건:\n  '+errs.slice(0,8).join('\n  ')) : '✅ 오류 0건');
console.log(warns.length? ('⚠ 콘솔경고 '+warns.length+'건: '+warns.slice(0,3).join(' | ')) : '✅ 콘솔 경고 0건');
await b.close();})();
