const {chromium}=require('playwright');
const VIEWS=[
  {n:'phone', w:412,h:846, dsf:2, mobile:true},
  {n:'a9plus', w:412,h:846, dsf:2.6, mobile:true},
  {n:'tablet', w:800,h:1200, dsf:2, mobile:true},
  {n:'pc', w:1280,h:800, dsf:1, mobile:false},
  {n:'land', w:846,h:412, dsf:2, mobile:true}
];
(async()=>{
  const b=await chromium.launch();
  let allErrs=[];
  for(const v of VIEWS){
    const p=await b.newPage({viewport:{width:v.w,height:v.h},deviceScaleFactor:v.dsf,isMobile:v.mobile,hasTouch:v.mobile});
    const errs=[];
    p.on('pageerror',e=>errs.push('['+v.n+'] PAGEERROR: '+e.message));
    p.on('console',m=>{ if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text())) errs.push('['+v.n+'] CONSOLE: '+m.text()); });
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI && window.__TORI.ready===true',{timeout:60000}).catch(()=>errs.push('['+v.n+'] BOOT TIMEOUT'));
    const t0=Date.now();
    await p.evaluate(()=>window.__TORI.beginPlay());
    await p.waitForTimeout(1200);
    await p.screenshot({path:'v_'+v.n+'.png'});

    // --- 심화 테스트: 자원 지급 후 전 시스템 구동 ---
    const res=await p.evaluate(async ()=>{
      const T=window.__TORI, S=T.S, log=[];
      // 자원 지급
      S.acorn=999999; S.star=9999;
      ['leaf','pebble','jelly','pollen','honey','glow','frost','ember','rainbow','crystal','starcore']
        .forEach(m=>S.mat[m]=60);
      ['sword','fire','ice','leafb','hammer','bomb'].forEach(a=>{S.owned[a]=1;S.cards[a]=20;});
      S.lv=25;
      // 진화 전부
      for(const a of ['sword','fire','ice','leafb','hammer','bomb']){
        for(let k=0;k<2;k++){
          const before=S.tier[a]|0;
          T.openSheet('fuse',1); T.closeSheet();
        }
      }
      return log;
    });
    // 진화/강화 API 직접 호출 (내부 함수는 __TORI 미노출 → UI 통해 검증)
    const sysRes=await p.evaluate(()=>{
      const T=window.__TORI, S=T.S, out={};
      // 능력 6종 전부 장착 순회하며 공격 발사
      out.abilTest=[];
      for(const a of ['sword','fire','ice','leafb','hammer','bomb']){
        S.abil=a;
        for(let i=0;i<6;i++) T.doAttack(T.P.x+140, T.P.y-60);
        out.abilTest.push(a);
      }
      // 필살기
      S.ult=100; T.doUlt();
      // 보스 소환
      T.spawnEnemy(['b_bug','b_moth','b_mole','b_bear'][S.zone],1);
      return out;
    });
    await p.waitForTimeout(1600);
    await p.screenshot({path:'v_'+v.n+'_boss.png'});

    // 시트 전부 열기 (자원 가득 상태)
    for(const k of ['bag','fuse','forge','book','map']){
      for(const tab of [0,1,2]){
        await p.evaluate(([k,t])=>window.__TORI.openSheet(k,t),[k,tab]);
        await p.waitForTimeout(120);
      }
      if(v.n==='phone'){ await p.screenshot({path:'s_'+k+'.png'}); }
      await p.evaluate(()=>window.__TORI.closeSheet());
      await p.waitForTimeout(180);
    }
    // 진화 버튼 실제 클릭
    await p.evaluate(()=>window.__TORI.openSheet('fuse',1));
    await p.waitForTimeout(200);
    for(let e=0;e<12;e++){
      const did=await p.evaluate(()=>{ const b=document.querySelector('.bigbtn.mag:not([disabled])'); if(b){b.click();return true;} return false; });
      await p.waitForTimeout(300);
      if(!did) break;
    }
    await p.evaluate(()=>window.__TORI.closeSheet());
    // 강화 버튼 실제 클릭 x5
    await p.evaluate(()=>window.__TORI.openSheet('forge',0));
    for(let i=0;i<8;i++){
      await p.waitForTimeout(300);
      const did=await p.evaluate(()=>{ const b=document.querySelector('.bigbtn.alt:not([disabled])'); if(b){b.click();return true;} return false; });
      if(!did) break;
      await p.waitForTimeout(560);
    }
    if(v.n==='phone') await p.screenshot({path:'s_forge_after.png'});
    await p.evaluate(()=>window.__TORI.closeSheet());
    await p.waitForTimeout(300);

    // 장시간 자동전투 + FPS
    await p.evaluate(()=>{ window.__fps=[]; let n=0,t0=performance.now();
      (function f(t){ n++; if(t-t0>1000){window.__fps.push(n);n=0;t0=t;} requestAnimationFrame(f);})(performance.now()); });
    for(let i=0;i<90;i++){
      await p.evaluate(()=>{ const T=window.__TORI; let e=null;
        for(const x of T.EN){ if(x.alive&&!x.dead){e=x;break;} }
        T.doAttack(e?e.x:T.P.x+150, e?e.y-e.size*0.5:T.P.y-60);
        if(Math.random()<0.2){ T.S.ult=100; T.doUlt(); }
      });
      await p.waitForTimeout(60);
    }
    const fin=await p.evaluate(()=>({fps:window.__fps, s:{lv:window.__TORI.S.lv,zone:window.__TORI.S.zone,stage:window.__TORI.S.stage,tier:window.__TORI.S.tier,plus:window.__TORI.S.plus,state:window.__TORI.G.state}}));
    await p.screenshot({path:'v_'+v.n+'_late.png'});
    const minF=Math.min(...fin.fps), avgF=(fin.fps.reduce((a,c)=>a+c,0)/fin.fps.length).toFixed(1);
    console.log(`[${v.n} ${v.w}x${v.h}@${v.dsf}] boot+run ok | fps min=${minF} avg=${avgF} | ${JSON.stringify(fin.s)}`);
    allErrs=allErrs.concat(errs);
    await p.close();
  }
  console.log(allErrs.length? '\n=== ERRORS ===\n'+allErrs.join('\n') : '\n=== NO ERRORS ACROSS ALL VIEWPORTS ===');
  await b.close();
})();
