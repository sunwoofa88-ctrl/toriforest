/* 버튼을 실제로 눌러 보고 '눌린 표시'가 나는지 측정 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:915,height:412},deviceScaleFactor:2.6,isMobile:true,hasTouch:true});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>window.__TORI.beginPlay());
 await p.waitForTimeout(1200);
 for(const id of ['btnAtk','btnUlt','btnInhale','sk0']){
   const r=await p.evaluate(async(id)=>{
     const e=document.getElementById(id); if(!e) return {id,err:'없음'};
     const b=e.getBoundingClientRect();
     const cs0=getComputedStyle(e);
     const before={t:cs0.transform,s:cs0.boxShadow,f:cs0.filter,cls:e.className};
     // 실제 터치 이벤트
     const x=b.x+b.width/2, y=b.y+b.height/2;
     const opt={bubbles:true,cancelable:true,pointerId:1,pointerType:'touch',clientX:x,clientY:y,isPrimary:true};
     e.dispatchEvent(new PointerEvent('pointerdown',opt));
     e.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,
       touches:[new Touch({identifier:1,target:e,clientX:x,clientY:y})],
       targetTouches:[new Touch({identifier:1,target:e,clientX:x,clientY:y})],
       changedTouches:[new Touch({identifier:1,target:e,clientX:x,clientY:y})]}));
     await new Promise(r=>setTimeout(r,140));
     const cs1=getComputedStyle(e);
     const during={t:cs1.transform,s:cs1.boxShadow,f:cs1.filter,cls:e.className};
     e.dispatchEvent(new PointerEvent('pointerup',opt));
     e.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],targetTouches:[],
       changedTouches:[new Touch({identifier:1,target:e,clientX:x,clientY:y})]}));
     return {id, before, during,
       변화: (before.t!==during.t)||(before.s!==during.s)||(before.f!==during.f)||(before.cls!==during.cls)};
   },id);
   console.log(`${r.id.padEnd(10)} 눌림표시 ${r.변화?'✅ 있음':'❌ 없음'}`);
   if(!r.변화) console.log(`   transform=${r.during&&r.during.t}  class="${r.during&&r.during.cls}"`);
 }
 await b.close();
})();
