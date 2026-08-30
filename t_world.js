const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const e=[];p.on('pageerror',x=>e.push('PAGEERROR: '+x.message+'\n  '+(x.stack||'').split('\n')[1]));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(2600);
  await p.evaluate(()=>{document.getElementById('banner').innerHTML='';document.getElementById('toasts').innerHTML='';});
  await p.screenshot({path:'Q_spawn.png'});
  // 전체 월드 조감도
  const full=await p.evaluate(()=>{
    const T=window.__TORI, WD=T.WD;
    const c=document.createElement('canvas'); c.width=WD.ground.width; c.height=WD.ground.height;
    const g=c.getContext('2d'); g.drawImage(WD.ground,0,0);
    return c.toDataURL('image/png');
  });
  const fs=require('fs');
  fs.writeFileSync('Q_worldmap.png', Buffer.from(full.split(',')[1],'base64'));
  // 캠프까지 이동해서 전투
  await p.evaluate(()=>{ const T=window.__TORI, c=T.WD.camps[0];
    T.P.x=c.x-120; T.P.y=c.y; });
  await p.waitForTimeout(3000);
  await p.screenshot({path:'Q_camp.png'});
  for(let i=0;i<26;i++){
    await p.evaluate(()=>{const T=window.__TORI;let e=null;
      for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}} T.doAttack(e?e.x:T.P.x+120,e?e.y:T.P.y);});
    await p.waitForTimeout(85);
  }
  await p.screenshot({path:'Q_fight.png'});
  const st=await p.evaluate(()=>({kills:window.__TORI.S.prog['0'].kills, lv:window.__TORI.S.lv,
    en:window.__TORI.EN.filter(x=>x.alive&&!x.dead).length, acorn:window.__TORI.S.acorn}));
  console.log('전투 결과:',JSON.stringify(st));
  console.log(e.length?e.join('\n'):'에러 없음');
  await b.close();
})();
