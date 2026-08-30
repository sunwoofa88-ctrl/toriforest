const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  // --- 1) 타이틀/게임플레이/가로/PC 스크린샷 ---
  for(const v of [['title',412,846,2],['land',846,412,2],['pc',1280,800,1]]){
    const p=await b.newPage({viewport:{width:v[1],height:v[2]},deviceScaleFactor:v[3],isMobile:v[0]!=='pc',hasTouch:v[0]!=='pc'});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
    if(v[0]==='title'){ await p.screenshot({path:'F_title.png'}); }
    await p.evaluate(()=>{const T=window.__TORI,S=T.S; S.lv=12; S.acorn=3400; S.star=22;
      S.owned={sword:1,fire:1,ice:1}; S.cards={fire:2}; S.tier={sword:1}; S.plus={sword:3};
      S.pets={rabbit:1}; T.beginPlay(); });
    await p.waitForTimeout(2400);
    for(let i=0;i<22;i++){ await p.evaluate(()=>{const T=window.__TORI;let e=null;
      for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}} if(e)T.doAttack(e.x,e.y-e.size*0.5);}); await p.waitForTimeout(85); }
    await p.screenshot({path:'F_'+v[0]+'.png'});
    await p.close();
  }
  // --- 2) 장시간 안정성 / 메모리 ---
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push('C:'+m.text());});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{window.__TORI.S.lv=30;window.__TORI.beginPlay();});
  const h0=await p.evaluate(()=>performance.memory?performance.memory.usedJSHeapSize:0);
  const t0=Date.now();
  let ticks=0;
  while(Date.now()-t0 < 100000){
    await p.evaluate(()=>{const T=window.__TORI;let e=null;
      for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}}
      T.doAttack(e?e.x:T.P.x+150,e?e.y-e.size*0.5:T.P.y-60);
      if(T.S.ult>=100) T.doUlt();
      if(Math.random()<0.02){ T.S.abil=['sword','fire','ice','leafb','hammer','bomb'][(Math.random()*6)|0]; T.S.owned[T.S.abil]=1; }
    });
    ticks++; await p.waitForTimeout(70);
  }
  const h1=await p.evaluate(()=>performance.memory?performance.memory.usedJSHeapSize:0);
  const fin=await p.evaluate(()=>{const T=window.__TORI,S=T.S;
    let live=0; for(const x of T.EN) if(x.alive) live++;
    return {zone:S.zone,stage:S.stage,lv:S.lv,live:live,state:T.G.state,q:T.quality};});
  console.log('장시간(100초) 구동:',ticks,'틱  heap',(h0/1e6).toFixed(1),'MB →',(h1/1e6).toFixed(1),'MB');
  console.log('상태:',JSON.stringify(fin));
  await p.screenshot({path:'F_long.png'});
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'NO ERRORS (100s stress)');
  await b.close();
})();
