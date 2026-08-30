/* 스킬 4개가 실제로 서로 다르게 보이는지 : 시전 순간 화면을 픽셀로 비교 */
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:900,height:560},deviceScaleFactor:1.5});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))errs.push(m.text())});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
for(const wep of ['sword','staff','bow','hammer']){
  await p.evaluate(w=>{
    const T=window.__TORI, D=T.dbg;
    T.beginPlay(); T.S.lv=30; T.S.skAuto=0;
    const wid=T.EQ_IDS.find(i=>T.EQUIP[i].slot===0 && D.WEP_TYPE[T.EQUIP[i].tn].id===w);
    T.giveEquip(wid); D.eqSet('w',wid);
  }, wep);
  await p.waitForTimeout(600);
  const shots=[];
  for(let i=0;i<4;i++){
    await p.evaluate(()=>{const T=window.__TORI; T.EN.forEach(e=>e.alive=false);
      for(let k=0;k<3;k++) T.spawnEnemy();});
    await p.waitForTimeout(250);
    await p.evaluate(i=>{const T=window.__TORI,D=T.dbg;
      D.SK_CDset&&D.SK_CDset(); const ids=D.curSkills();
      const A=D.ABIL[ids[i]], t=0;
      T.doAttack(T.dbg.P.x+180, T.dbg.P.y, ids[i]);
    }, i);
    await p.waitForTimeout(110);
    const buf=await p.screenshot();
    shots.push(buf);
    fs.writeFileSync('/root/toriforest/SIG_'+wep+'_'+i+'.png', buf);
    await p.waitForTimeout(700);
  }
  // 서로 얼마나 다른지 (바이트 길이 + 픽셀 diff 근사)
  const sz=shots.map(s=>s.length);
  console.log(wep, '스크린샷 크기:', sz.join(' / '));
}
console.log('ERR', errs.slice(0,3));
await b.close();})();
