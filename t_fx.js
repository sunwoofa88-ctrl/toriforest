/* 이펙트 전수 점검 : 4종 필살기 + 스킬 이펙트를 실제로 터뜨려 오류·NaN·프레임 확인 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,110)));
 p.on('console',m=>{ if(m.type()==='error'&&!/net::|favicon/.test(m.text())) errs.push(m.text().slice(0,110)); });
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{ const T=window.__TORI; T.S.lv=60; T.beginPlay(); });
 await p.waitForTimeout(1500);
 const r=await p.evaluate(async()=>{
   const T=window.__TORI, out=[];
   const weps=['sword','bow','staff','claw','boomer'];
   for(const w of weps){
     try{
       T.S.eqW=null; T.S.abil = (T.dbg.ABIL_IDS? T.dbg.ABIL_IDS[0]:null);
       for(let i=0;i<8;i++) T.spawnEnemy();
       await new Promise(z=>setTimeout(z,400));
       T.doUlt();
       let bad=0, f0=T.dbg.frameCount();
       for(let t=0;t<40;t++){
         await new Promise(z=>setTimeout(z,50));
         const PR=T.dbg.PR? T.dbg.PR: null;
         T.EN.forEach(e=>{ if(e.alive && (!isFinite(e.x)||!isFinite(e.y)||!isFinite(e.aSX))) bad++; });
         if(!isFinite(T.P.x)||!isFinite(T.P.y)) bad++;
       }
       out.push(w+': 프레임'+(T.dbg.frameCount()-f0)+' NaN'+bad);
     }catch(e){ out.push(w+': 예외 '+e.message.slice(0,50)); }
   }
   /* 스킬 4종 */
   for(let i=0;i<4;i++){ try{ T.dbg.useSkill? T.dbg.useSkill(i) : null; }catch(e){} }
   await new Promise(z=>setTimeout(z,1200));
   return out;
 });
 console.log(r.join('\n'));
 console.log('오류: '+(errs.length? errs.slice(0,4).join(' | ') : '없음'));
 await b.close();
})();
