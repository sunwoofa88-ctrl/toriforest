/* 폰 가로에서 시트(가방/장비/펫/지도) 세로 예산이 어떻게 쓰이는지 실측 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const CASES=[['갤S22+ 가로',915,412,2.6],['A9+ 가로',1280,800,1.5],['작은폰 가로',740,360,3]];
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 for(const [nm,w,h,d] of CASES){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI; T.openSheet('gear');
    await new Promise(r=>setTimeout(r,400));
    const R=s=>{const e=document.querySelector(s); if(!e) return null;
      const b=e.getBoundingClientRect(); return {h:Math.round(b.height),w:Math.round(b.width),y:Math.round(b.y)};};
    const inn=R('#sheetIn'), hd=R('.sheet-hd'), tb=R('.tabs'), bd=R('.sheet-bd'), ft=R('.sheet-foot');
    const bdEl=document.querySelector('.sheet-bd');
    return {H:innerHeight, inn, hd, tb, bd, ft,
      본문비율: bd&&inn? +(100*bd.h/innerHeight).toFixed(1):null,
      껍데기: (hd?hd.h:0)+(tb?tb.h:0)+(ft?ft.h:0),
      스크롤: bdEl? {client:bdEl.clientHeight, scroll:bdEl.scrollHeight}:null,
      닫기높이: ft?ft.h:0,
      제목폰트: getComputedStyle(document.querySelector('.sheet-hd h2')).fontSize,
      닫기폰트: getComputedStyle(document.querySelector('.closebar')).fontSize };
  });
  console.log(`\n■ ${nm}  화면높이 ${r.H}`);
  console.log(`   머리 ${r.hd&&r.hd.h} + 탭 ${r.tb&&r.tb.h} + 닫기바 ${r.닫기높이}  = 껍데기 ${r.껍데기}px (${(100*r.껍데기/r.H).toFixed(0)}%)`);
  console.log(`   실제 내용 ${r.bd&&r.bd.h}px (${r.본문비율}%)   스크롤 ${r.스크롤&&r.스크롤.client}/${r.스크롤&&r.스크롤.scroll}`);
  console.log(`   제목 ${r.제목폰트} · 닫기 ${r.닫기폰트}`);
  await p.close();
 }
 await b.close();
})();
