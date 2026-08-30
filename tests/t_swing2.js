/* 휘두르는 동안 손이 자루에 붙어 있는지 — 공격 4종 × 5프레임 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(2000);
  await p.evaluate(()=>{ const T=window.__TORI; let tn=-1;
    T.WEP_TYPE.forEach((w,k)=>{ if(w.id==='great') tn=k; });
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } } });
  await p.waitForTimeout(500);
  const el=await p.$('canvas');
  const shots=[];
  for(let s=0;s<4;s++){
    await p.evaluate((s)=>{ const T=window.__TORI; T.P.castS=s; T.P.atkT=0.24; T.P.atkT0=0.24; }, s);
    for(let f=0;f<3;f++){
      await p.evaluate((v)=>{ const T=window.__TORI; T.P.atkT=0.24*(1-v); }, 0.2+f*0.3);
      await p.waitForTimeout(90);
      const fn='/tmp/sw_'+s+'_'+f+'.png';
      await el.screenshot({path:fn}); shots.push(fn);
    }
  }
  console.log(shots.length);
  await b.close();
})();
