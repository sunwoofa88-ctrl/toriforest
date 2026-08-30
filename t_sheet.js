const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{
    const T=window.__TORI,S=T.S;
    S.lv=18; S.acorn=12500; S.star=48; S.zone=1; S.stage=2;
    S.owned={sword:1,fire:1,ice:1,leafb:1,hammer:1};
    S.cards={sword:5,fire:3,ice:1,leafb:2,hammer:4};
    S.tier={sword:1,fire:1}; S.plus={sword:4,fire:2,ice:1};
    S.mat={leaf:14,pebble:9,jelly:6,pollen:11,honey:4,glow:3,frost:2,crystal:1};
    S.pets={rabbit:2,chick:1};
    S.codex={bug:12,jellym:8,bird:6,glowb:3,rock:2,b_bug:1};
    for(let i=0;i<8;i++)S.cleared['0-'+i]=1;
    S.cleared['1-0']=1;S.cleared['1-1']=1;
    T.beginPlay();
  });
  await p.waitForTimeout(900);
  const shots=[['bag',0],['bag',1],['bag',2],['fuse',0],['fuse',1],['forge',0],['book',0],['book',1],['book',2],['map',0]];
  for(const [k,t] of shots){
    await p.evaluate(([k,t])=>window.__TORI.openSheet(k,t),[k,t]);
    await p.waitForTimeout(420);
    await p.screenshot({path:'sh_'+k+t+'.png'});
    await p.evaluate(()=>window.__TORI.closeSheet());
    await p.waitForTimeout(240);
  }
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
