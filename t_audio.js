const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(2500);
  const a=await p.evaluate(()=>{
    // 내부 상태는 노출 안되므로 AudioContext 존재/노드 수로 간접 확인
    return { ctxs: (window.AudioContext||window.webkitAudioContext)?'ok':'none',
             sfx: window.__TORI.S.sfx };
  });
  // 소리 토글 클릭
  await p.click('#btnSound'); await p.waitForTimeout(300);
  const off=await p.evaluate(()=>window.__TORI.S.sfx);
  await p.click('#btnSound'); await p.waitForTimeout(300);
  const on=await p.evaluate(()=>window.__TORI.S.sfx);
  console.log('audio:',JSON.stringify(a),'toggle off→',off,'on→',on);
  await p.screenshot({path:'a_sound.png'});
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
