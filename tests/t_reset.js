const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=25;T.S.acorn=5555;T.beginPlay();});
await p.waitForTimeout(700);
const r=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.openSheet('map',0);
  await new Promise(r=>setTimeout(r,400));
  const bd=document.getElementById('sheetBody');
  const btns=[...bd.querySelectorAll('button')].map(e=>e.textContent.trim());
  const reset=[...bd.querySelectorAll('button')].filter(e=>e.textContent.indexOf('처음부터')>=0);
  const secs=[...bd.querySelectorAll('.sec-t')].map(e=>e.textContent.trim());
  return {btns, hasReset:reset.length>0, secs, scrollH:bd.scrollHeight, viewH:Math.round(bd.getBoundingClientRect().height)};
});
console.log('지도 화면 섹션: '+JSON.stringify(r.secs));
console.log('버튼들: '+JSON.stringify(r.btns));
console.log('초기화 버튼 존재: '+(r.hasReset?'✅ 있음':'❌ 없음'));
console.log('내용 높이 '+r.scrollH+'px / 보이는 높이 '+r.viewH+'px');
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
