const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846}, deviceScaleFactor:2, isMobile:true, hasTouch:true});
  const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text())) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI && window.__TORI.ready===true',{timeout:40000}).catch(()=>errs.push('BOOT TIMEOUT'));
  await p.screenshot({path:'shot_boot.png'});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1400);
  await p.screenshot({path:'shot_play1.png'});

  // 자동 플레이: 적을 향해 탭
  const fps=[];
  await p.evaluate(()=>{ window.__fps=[]; let l=0,n=0,t0=performance.now();
    function f(t){ n++; if(t-t0>1000){ window.__fps.push(n); n=0; t0=t; } requestAnimationFrame(f);} requestAnimationFrame(f); });
  for(let i=0;i<70;i++){
    const pt=await p.evaluate(()=>{
      const T=window.__TORI; let e=null;
      for(const x of T.EN){ if(x.alive&&!x.dead){e=x;break;} }
      return e? {x:e.x,y:e.y-e.size*0.5} : {x:300,y:400};
    });
    await p.mouse.click(Math.min(410,Math.max(2,pt.x)), Math.min(700,Math.max(2,pt.y)));
    if(i%12===5){ await p.evaluate(()=>{window.__TORI.P.inhale=true;}); await p.waitForTimeout(700); await p.evaluate(()=>{window.__TORI.P.inhale=false;}); }
    await p.waitForTimeout(90);
  }
  await p.screenshot({path:'shot_play2.png'});
  const st=await p.evaluate(()=>{const T=window.__TORI;return{lv:T.S.lv,acorn:T.S.acorn,star:T.S.star,mat:T.S.mat,cards:T.S.cards,owned:T.S.owned,codex:T.S.codex,stage:T.S.stage,zone:T.S.zone,ult:Math.round(T.S.ult),state:T.G.state,hp:Math.round(T.P.size)};});
  const f=await p.evaluate(()=>window.__fps);
  console.log('STATE:',JSON.stringify(st));
  console.log('FPS samples:',f.join(','));
  // 시트 열어보기
  for(const k of ['bag','fuse','forge','book','map']){
    await p.evaluate(k=>window.__TORI.openSheet(k,0),k);
    await p.waitForTimeout(320);
    await p.screenshot({path:'shot_sheet_'+k+'.png'});
    await p.evaluate(()=>window.__TORI.closeSheet());
    await p.waitForTimeout(260);
  }
  console.log(errs.length? '--- ERRORS ---\n'+errs.join('\n') : 'NO ERRORS');
  await b.close();
})();
