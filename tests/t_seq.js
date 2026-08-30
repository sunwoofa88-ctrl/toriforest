/* 시전 후 정해진 시간에 딱 한 장씩 — 스크린샷 지연 때문에 연속 촬영은 시간이 안 맞는다 */
const {chromium}=require('playwright');
const fs=require('fs');
const SLOT=parseInt(process.argv[2]||'3');
const WEP=process.argv[3]||'sword';
const DELAYS=[40,130,240,380,540];
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:820,height:560},deviceScaleFactor:2});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(w=>{
  const T=window.__TORI, D=T.dbg;
  T.beginPlay(); T.S.lv=30; T.S.skAuto=0;
  const wid=T.EQ_IDS.find(i=>T.EQUIP[i].slot===0 && D.WEP_TYPE[T.EQUIP[i].tn].id===w);
  T.giveEquip(wid); D.eqSet('w',wid);
}, WEP);
await p.waitForTimeout(800);
for(let d=0; d<DELAYS.length; d++){
  await p.evaluate(()=>{const T=window.__TORI; T.EN.forEach(e=>e.alive=false); for(let k=0;k<2;k++) T.spawnEnemy();});
  await p.waitForTimeout(260);
  await p.evaluate(s=>{const T=window.__TORI,D=T.dbg; D.SK_CDset(); T.doAttack(T.dbg.P.x+190, T.dbg.P.y+16, D.curSkills()[s]);}, SLOT);
  await p.waitForTimeout(DELAYS[d]);
  fs.writeFileSync('/root/toriforest/SEQ_'+WEP+'_'+SLOT+'_'+d+'.png', await p.screenshot());
  await p.waitForTimeout(900);
}
console.log('ok'); await b.close();})();
