/* pole 계열 최종 육안 검증 — 튜토리얼 배너를 피해 캐릭터를 이동시킨 뒤 캡처 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:700},deviceScaleFactor:2});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(2500); // 튜토리얼 토스트 자연 소멸 대기

  const names=['창','낫','미늘창','삼지창','언월도','사슬낫'];
  for(const name of names){
    const id=await p.evaluate((name)=>{
      const T=window.__TORI;
      for(const tn in T.WEP_TYPE){ if(T.WEP_TYPE[tn].n===name){
        for(const k in T.EQUIP){ const e=T.EQUIP[k]; if(e.slot===0&&e.tn==tn){
          T.S.eq=T.S.eq||{}; T.S.eq[k]=1; T.eqSet('w',k); return k; } }
      } }
      return null;
    }, name);
    if(!id){ console.log(name,'장비 못 찾음'); continue; }

    for(const [label,setup] of [
      ['idle', ()=>{const T=window.__TORI;T.EN.length=0;T.P.atkT=0;T.P.moving=false;}],
      ['atk',  ()=>{const T=window.__TORI;T.EN.length=0;T.P.moving=false;T.P.atkT=0.5;}],
    ]){
      await p.evaluate(setup);
      await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      await p.screenshot({path:`/tmp/final_${name}_${label}.png`,clip:{x:200,y:150,width:300,height:300}});
    }
    console.log(name,'캡처 완료');
  }
  await b.close();
})();
