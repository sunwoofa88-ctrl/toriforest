const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=33;T.S.acorn=8888;T.S.star=444;T.S.chap=21;T.beginPlay();
  for(let i=0;i<8;i++) T.giveEquip(T.rollEquipDrop(50,true));
  T.S.gachaBonus=5; for(let i=0;i<5;i++) T.doGacha();});
await p.waitForTimeout(700);
// 톱니는 지도에서만 보여야 한다
const vis=await p.evaluate(async()=>{
  const T=window.__TORI, out={};
  for(const s of ['bag','gear','pet','make','book','map']){
    T.openSheet(s,0); await new Promise(r=>setTimeout(r,260));
    out[s]=!document.getElementById('btnReset').classList.contains('hidden');
  }
  return out;
});
console.log('⚙ 버튼 노출: '+JSON.stringify(vis));
// 취소 동작
const cancel=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.openSheet('map',0); await new Promise(r=>setTimeout(r,300));
  document.getElementById('btnReset').click();
  await new Promise(r=>setTimeout(r,300));
  const m=document.querySelector('.modal');
  const has=!!m, title=m? m.querySelector('.modal-t').textContent:'';
  const btns=m? [...m.querySelectorAll('button')].map(e=>e.textContent):[];
  m.querySelector('.mb-no').click();
  await new Promise(r=>setTimeout(r,300));
  return {has,title,btns, closed:!document.querySelector('.modal'), lv:T.S.lv};
});
console.log('팝업: '+cancel.title+'  버튼 '+JSON.stringify(cancel.btns));
console.log('취소 → 팝업닫힘 '+cancel.closed+', 레벨 유지 '+cancel.lv+' (33 이어야 정상)');
// 확인 동작
const ok=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.openSheet('map',0); await new Promise(r=>setTimeout(r,300));
  document.getElementById('btnReset').click();
  await new Promise(r=>setTimeout(r,300));
  document.querySelector('.mb-yes').click();
  await new Promise(r=>setTimeout(r,1200));
  return {lv:T.S.lv, acorn:T.S.acorn, star:T.S.star, chap:T.S.chap,
    eq:Object.keys(T.S.eq||{}).length, pets:Object.keys(T.S.pets||{}).length,
    playing:!!T.WD};
});
console.log('확인 → Lv'+ok.lv+' 도토리'+ok.acorn+' 별'+ok.star+' 챕터'+ok.chap+' 장비'+ok.eq+' 펫'+ok.pets+' 맵정상 '+ok.playing);
console.log((ok.lv===1&&ok.acorn===0&&ok.chap===0&&ok.eq===0&&ok.pets===0&&ok.playing)?'✅ 초기화 정상':'❌ 문제');
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
