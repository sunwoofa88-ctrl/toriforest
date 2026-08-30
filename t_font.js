// 글꼴이 오프라인(APK)에서 실제로 적용되는지 검증한다.
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  let blocked=0;
  await ctx.route(/^https?:/, r=>{ blocked++; r.abort(); });
  const p=await ctx.newPage();
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('400 16px "Jua"','도토리숲 Adventure'),
      document.fonts.load('400 16px "BlackHanSans"','도토리숲 Adventure'),
      document.fonts.load('600 16px "Fredoka"','Adventure'),
      document.fonts.load('700 16px "Fredoka"','Adventure'),
    ]);
    const has=(f,s)=>document.fonts.check('16px "'+f+'"', s);
    const meas=(fam,txt)=>{const c=document.createElement('canvas').getContext('2d');
      c.font='40px '+fam; return Math.round(c.measureText(txt).width);};
    return {
      loaded: [...document.fonts].length,
      juaKo:  has('Jua','도토리숲'), juaLa: has('Jua','Adventure'),
      bhsKo:  has('BlackHanSans','도토리숲'),
      fred6:  document.fonts.check('600 16px "Fredoka"','Adventure'),
      fred7:  document.fonts.check('700 16px "Fredoka"','Adventure'),
      wJua:   meas("'Jua'",'도토리숲 대모험'),
      wSys:   meas('sans-serif','도토리숲 대모험'),
      wBhs:   meas("'BlackHanSans'",'도토리숲 대모험'),
    };
  });
  console.log('차단된 외부요청', blocked); console.log(r);
  const ok = r.juaKo&&r.juaLa&&r.bhsKo&&r.fred6&&r.fred7 && r.wJua!==r.wSys && r.wBhs!==r.wSys && r.wBhs!==r.wJua;
  console.log(ok? '✅ 오프라인 글꼴 3종 적용됨(서브셋)' : '❌ 글꼴 미적용');
  await b.close(); process.exit(ok?0:1);
})();
