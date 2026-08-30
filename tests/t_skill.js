const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
for(const D of [{n:'A9+ 가로',w:1280,h:800,d:1.5},{n:'폰 가로',w:702,h:324,d:2},{n:'폰 세로',w:412,h:846,d:3}]){
const p=await b.newPage({viewport:{width:D.w,height:D.h},deviceScaleFactor:D.d,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))errs.push(m.text())});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>{const T=window.__TORI; T.beginPlay(); T.S.lv=40; T.S.acorn=999999;
  for(let i=0;i<40;i++) T.giveEquip(T.rollEquipDrop(40,true));});
await p.waitForTimeout(900);
const r=await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg;
  const ids=D.curSkills? D.curSkills():[];
  const names=ids.map(i=>T.dbg.ABIL[i]?T.dbg.ABIL[i].n:'?');
  const W=window.innerWidth,H=window.innerHeight;
  const btns=[...document.querySelectorAll('.skbtn')].map(e=>{const r=e.getBoundingClientRect();
    return {w:Math.round(r.width),h:Math.round(r.height),out:(r.right>W+1||r.bottom>H+1||r.left<-1||r.top<-1),txt:(e.parentNode.querySelector('.skn')||{textContent:''}).textContent};});
  const dock=document.querySelector('.dock').getBoundingClientRect();
  return {ids, names, btns, dockOver:(dock.right>W+2||dock.left<-2), auto:document.getElementById('btnAuto').textContent};
});
console.log(D.n, '스킬:', r.names.join(' / '), '| 자동:', r.auto);
console.log('   버튼:', r.btns.map(x=>x.w+'x'+x.h+(x.out?' 화면밖!':'')+' "'+x.txt+'"').join(', '), '| dock넘침', r.dockOver);
// 자동 시전 확인
await p.evaluate(()=>{const T=window.__TORI; for(let i=0;i<6;i++) T.spawnEnemy();});
await p.waitForTimeout(2500);
const cast=await p.evaluate(()=>{const D=window.__TORI.dbg; return {cd:D.SK_CD?D.SK_CD():null};});
console.log('   자동시전 후 쿨다운:', JSON.stringify(cast.cd), 'ERR', errs.slice(0,2));
await p.screenshot({path:'/root/toriforest/SKILL_'+D.w+'.png'});
await p.close();}
await b.close();})();
