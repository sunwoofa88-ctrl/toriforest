/* 공격이 나갈 때 버튼이 실제로 '움직이는지' 렌더된 transform 으로 측정 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:412,height:915},deviceScaleFactor:2.6,isMobile:true,hasTouch:true});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=20;T.beginPlay();});
 await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>new Promise(res=>{
   const e=document.getElementById('btnAtk');
   const seen=new Set(); let n=0;
   const iv=setInterval(()=>{ seen.add(getComputedStyle(e).transform); n++; },12);
   // 실제 공격을 3번 발생시킨다
   let k=0;
   const fire=setInterval(()=>{ window.__TORI.doAttack(window.__TORI.P.x+120, window.__TORI.P.y); if(++k>=3) clearInterval(fire); },260);
   setTimeout(()=>{ clearInterval(iv); clearInterval(fire);
     res({표본:n, 서로다른변환:[...seen]}); },1400);
 }));
 console.log('표본',r.표본,'개 중 서로 다른 변환',r.서로다른변환.length,'가지');
 r.서로다른변환.slice(0,8).forEach(t=>console.log('   '+t));
 console.log(r.서로다른변환.length>2? '✅ 공격할 때마다 버튼이 실제로 움직인다':'❌ 안 움직인다');
 await b.close();
})();
