const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push('C:'+m.text());});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(500);
  // 흡입 테스트 (레벨 낮게 유지해 한방컷 방지)
  for(let t=0;t<260;t++){
    await p.evaluate(()=>{ const T=window.__TORI,P=T.P; let e=null;
      for(const x of T.EN){ if(x.alive&&!x.dead&&!x.boss){e=x;break;} }
      if(e){ P.inhale=true; P.facing=e.x>=P.x?1:-1; } else P.inhale=false; });
    await p.waitForTimeout(50);
  }
  const a=await p.evaluate(()=>{const S=window.__TORI.S;return{owned:S.owned,cards:S.cards,abil:S.abil,lv:S.lv,codex:S.codex};});
  console.log('흡입 결과:', JSON.stringify(a));
  await p.screenshot({path:'f_absorb.png'});
  // 보스 스테이지로 점프
  await p.evaluate(()=>{ const T=window.__TORI,S=T.S; S.lv=16;
    for(let i=0;i<7;i++) S.cleared['0-'+i]=1; });
  await p.evaluate(()=>window.__TORI.openSheet('map',0));
  await p.waitForTimeout(400);
  await p.evaluate(()=>{ const cells=document.querySelectorAll('.sheet-bd .grid .cell');
    for(const c of cells){ if(c.textContent.indexOf('1-8')>=0 && !c.classList.contains('locked')){ c.click(); return; } } });
  await p.waitForTimeout(1600);
  await p.screenshot({path:'f_bossintro.png'});
  let cleared=false;
  for(let t=0;t<600;t++){
    const r=await p.evaluate(()=>{ const T=window.__TORI; let e=null,boss=null;
      for(const x of T.EN){ if(x.alive&&!x.dead){ if(!e)e=x; if(x.boss)boss=x; } }
      if(e) T.doAttack(e.x,e.y-e.size*0.5);
      if(T.S.ult>=100) T.doUlt();
      return {z:T.S.zone,s:T.S.stage,boss:!!boss,state:T.G.state}; });
    if(t===60) await p.screenshot({path:'f_bossfight.png'});
    if(r.z>0){ cleared=true; break; }
    await p.waitForTimeout(45);
  }
  await p.waitForTimeout(900);
  await p.screenshot({path:'f_zone2.png'});
  const fin=await p.evaluate(()=>{const S=window.__TORI.S;return{zone:S.zone,stage:S.stage,pets:S.pets,owned:S.owned,cards:S.cards,star:S.star,acorn:S.acorn};});
  console.log('보스 클리어→다음 지역:', cleared?'YES':'NO', JSON.stringify(fin));
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'NO ERRORS');
  await b.close();
})();
