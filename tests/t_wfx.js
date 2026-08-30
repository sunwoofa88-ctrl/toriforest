const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
await p.waitForTimeout(700);
const r=await p.evaluate(async()=>{
  const T=window.__TORI, out={};
  for(const W of T.WEP_TYPE){
    const id=T.EQ_WEP.find(x=>T.EQUIP[x].tn===T.WEP_TYPE.indexOf(W));
    T.S.eq[id]=1; T.S.eqW=id; T.S.eqPlus[id]=0;
    T.PT.forEach(q=>q.alive=false);
    await new Promise(r=>setTimeout(r,700));      // 쿨다운 해소
    const b0=T.particleCount();
    T.doAttack(T.P.x+120,T.P.y);
    await new Promise(r=>setTimeout(r,90));
    out[W.n]=T.particleCount()-b0;
  }
  // 필살기 4종 확인
  const ults={};
  for(const wid of ['staff','hammer','bow','axe']){
    const tn=T.WEP_TYPE.findIndex(w=>w.id===wid);
    const id=T.EQ_WEP.find(x=>T.EQUIP[x].tn===tn);
    T.S.eq[id]=1; T.S.eqW=id;
    T.S.ult=100; T.doUlt();
    await new Promise(r=>setTimeout(r,120));
    ults[wid]=T.ultFxOn();
    await new Promise(r=>setTimeout(r,1900));
  }
  return {out, ults};
});
console.log('=== 무기별 공격 파티클 (1회 공격) ===');
Object.keys(r.out).forEach(k=>console.log('  '+k.padEnd(8)+' '+String(r.out[k]).padStart(3)+'개'));
console.log('=== 필살기 (활성/낙하체수/종류) ===');
Object.keys(r.ults).forEach(k=>console.log('  '+k.padEnd(8)+' '+r.ults[k]));
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
