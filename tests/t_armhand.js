/* 갑옷 6종 × 무기 1종 : 손 그림이 갑옷과 어울리는지 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1400,height:500},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1500);
  const out=await p.evaluate(async()=>{
    const T=window.__TORI;
    // 대검 장착
    let tn=-1; T.WEP_TYPE.forEach((w,k)=>{ if(w.id==='great') tn=k; });
    for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn===tn){ T.S.eq[k]=1; T.eqSet('w',k); break; } }
    // 갑옷 계열 6종을 대표하는 방어구 하나씩 찾는다
    const want={}, res=[];
    for(const k in T.EQUIP){
      const e=T.EQUIP[k]; if(e.slot!==1) continue;
      const cls=T.__armCls(e);
      if(cls && !want[cls]) want[cls]=k;
    }
    const holder=document.createElement('div');
    holder.style.cssText='position:fixed;left:0;top:0;z-index:99999;display:flex;background:#EAE0D0';
    document.body.appendChild(holder);
    const keys=Object.keys(want);
    for(const cls of keys){
      T.S.eq[want[cls]]=1; T.eqSet('a', want[cls]);
      T.refreshHeroArt();
      await new Promise(r=>setTimeout(r,120));
      const c=T.heroDollCanvas? T.heroDollCanvas() : null;
      if(c){ c.style.width='200px'; c.style.height='200px'; holder.appendChild(c); res.push(cls); }
    }
    return res;
  });
  console.log(out.join(' '));
  await p.waitForTimeout(400);
  await p.screenshot({path:'/tmp/armhand.png', clip:{x:0,y:0,width:Math.min(1400,200*out.length),height:200}});
  await b.close();
})();
