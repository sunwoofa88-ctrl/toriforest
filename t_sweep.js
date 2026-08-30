/* 런타임 전수 스윕 : 모든 시트·탭·버튼을 실제로 눌러 보며 예외를 수집한다 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const SHEETS=['bag','gear','pet','forge','book','map'];
async function sweep(b,nm,w,h,d){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  const errs=[];
  p.on('pageerror',e=>errs.push('PAGE: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text())) errs.push('CONSOLE: '+m.text()); });
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{const T=window.__TORI;
    T.S.lv=45; T.S.acorn=999999; T.S.star=9999;
    T.beginPlay();
    /* 내용이 있는 상태로 훑기 위해 재료·장비·펫을 채운다 */
    try{ for(const id of T.MAT_IDS.slice(0,40)) T.S.mats[id]=20; }catch(e){}
    try{ for(let i=0;i<25;i++) T.giveEquip(T.EQ_IDS[i%T.EQ_IDS.length]); }catch(e){}
    try{ for(let i=0;i<12;i++) T.doGacha&&T.doGacha(); }catch(e){}
  });
  await p.waitForTimeout(1200);
  let clicked=0, tabs=0;
  for(const sh of SHEETS){
    await p.evaluate(s=>window.__TORI.openSheet(s), sh).catch(e=>errs.push('openSheet '+sh+': '+e.message));
    await p.waitForTimeout(320);
    // 탭 전부 눌러 보기
    const nTabs=await p.evaluate(()=>document.querySelectorAll('.tabs .tab').length);
    for(let ti=0; ti<nTabs; ti++){
      await p.evaluate(i=>{const t=document.querySelectorAll('.tabs .tab')[i]; if(t) t.click();}, ti).catch(e=>errs.push('tab: '+e.message));
      tabs++;
      await p.waitForTimeout(260);
      // 본문 안의 버튼/셀을 최대 14개까지 눌러 본다
      const n=await p.evaluate(()=>document.querySelectorAll('.sheet-bd button, .sheet-bd .cell').length);
      for(let i=0;i<Math.min(n,14);i++){
        await p.evaluate(i=>{
          const el=document.querySelectorAll('.sheet-bd button, .sheet-bd .cell')[i];
          if(el && !el.disabled) el.click();
        }, i).catch(e=>errs.push('cell: '+e.message));
        clicked++;
        await p.waitForTimeout(45);
      }
    }
    await p.evaluate(()=>window.__TORI.closeSheet()).catch(()=>{});
    await p.waitForTimeout(180);
  }
  // 상단 메뉴 버튼 + 하단 조작부
  for(const id of ['btnBag','btnGear','btnPet','btnForge','btnBook','btnMap','btnSound','btnFull','btnAuto','sk0','sk1','sk2','sk3','btnAtk','btnUlt','btnInhale']){
    await p.evaluate(i=>{const e=document.getElementById(i); if(e) e.click();}, id).catch(e=>errs.push(id+': '+e.message));
    await p.waitForTimeout(90);
    await p.evaluate(()=>{ try{window.__TORI.closeSheet();}catch(e){} });
    clicked++;
  }
  // 회전
  await p.setViewportSize({width:h,height:w}); await p.waitForTimeout(700);
  await p.setViewportSize({width:w,height:h}); await p.waitForTimeout(700);
  // 저장/불러오기
  await p.evaluate(()=>{ window.__TORI.save(); }).catch(e=>errs.push('save: '+e.message));
  await p.reload(); await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);
  const st=await p.evaluate(()=>({lv:window.__TORI.S.lv, ui:window.__TORI.S.uiScale, mob:window.__TORI.S.mobLots}));
  console.log(`■ ${nm.padEnd(12)} 시트6 · 탭${tabs} · 클릭${clicked} · 회전·재시작  →  ${errs.length? '❌ 오류 '+errs.length+'건':'✅ 오류 0'}  (복구 lv=${st.lv})`);
  errs.slice(0,6).forEach(e=>console.log('     '+e.slice(0,150)));
  await p.close();
  return errs.length;
}
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 let bad=0;
 bad+=await sweep(b,'폰 세로',412,915,2.6);
 bad+=await sweep(b,'작은폰 세로',360,740,3);
 bad+=await sweep(b,'A9+ 가로',1280,800,1.5);
 bad+=await sweep(b,'A9+ 세로',800,1280,1.5);
 console.log('\n총 오류 '+bad+'건');
 await b.close();
})();
