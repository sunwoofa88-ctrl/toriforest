// 글꼴이 오프라인(APK)에서 실제로 적용되는지 검증한다.
// 네트워크를 전부 막고 로드해서, 그래도 Jua/BlackHanSans 가 쓰이는지 본다.
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  // 외부 요청 전부 차단 = APK 오프라인 상황
  let blocked=0;
  await ctx.route(/^https?:/, r=>{ blocked++; r.abort(); });
  const p=await ctx.newPage();
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(async()=>{
    await document.fonts.ready;
    // 캔버스/DOM 이 아직 안 쓴 글꼴은 브라우저가 늦게 읽는다. 명시적으로 읽힌다.
    await Promise.all([
      document.fonts.load('400 16px "Jua"','도토리숲 Adventure'),
      document.fonts.load('400 16px "BlackHanSans"','도토리숲 Adventure'),
      document.fonts.load('600 16px "Fredoka"','Adventure'),
      document.fonts.load('700 16px "Fredoka"','Adventure'),
    ]);
    const has=(f,s)=>document.fonts.check('16px "'+f+'"', s);
    // 실제 글자폭으로 대체글꼴과 구분한다 (check() 만으로는 부족하다)
    const meas=(fam,txt)=>{const c=document.createElement('canvas').getContext('2d');
      c.font='40px '+fam; return Math.round(c.measureText(txt).width);};
    return {
      loaded: [...document.fonts].length,
      juaKo:  has('Jua','도토리숲'),
      juaLa:  has('Jua','Adventure'),
      bhsKo:  has('BlackHanSans','도토리숲'),
      fred6:  document.fonts.check('600 16px "Fredoka"','Adventure'),
      fred7:  document.fonts.check('700 16px "Fredoka"','Adventure'),
      wJua:   meas("'Jua'",'도토리숲 대모험'),
      wSys:   meas('sans-serif','도토리숲 대모험'),
      wBhs:   meas("'BlackHanSans'",'도토리숲 대모험'),
      bodyFam:getComputedStyle(document.body).fontFamily,
    };
  });
  console.log('차단된 외부요청', blocked);
  console.log(r);
  const ok = r.juaKo&&r.juaLa&&r.bhsKo&&r.fred6&&r.fred7 && r.wJua!==r.wSys && r.wBhs!==r.wSys && r.wBhs!==r.wJua;
  console.log(ok? '✅ 오프라인에서도 글꼴 3종 전부 적용됨' : '❌ 글꼴 미적용');
  await b.close(); process.exit(ok?0:1);
})();
