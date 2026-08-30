const {chromium}=require('playwright');
const DEV=[{n:'320',w:320,h:640,d:2},{n:'A9+ 393',w:393,h:808,d:2.75},{n:'412',w:412,h:846,d:3},{n:'태블릿800',w:800,h:1280,d:2},{n:'PC1440',w:1440,h:900,d:1}];
const SHEETS=[['bag',2],['gear',3],['pet',3],['make',3],['book',3],['map',1]];
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
console.log('기기        시트    탭  가로넘침  최소버튼  글자겹침');
for(const D of DEV){
  const p=await b.newPage({viewport:{width:D.w,height:D.h},deviceScaleFactor:D.d,isMobile:D.w<600,hasTouch:D.w<600});
  const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.S.acorn=999999;T.S.star=9999;T.beginPlay();
    // 장비/펫 넉넉히 지급
    for(let i=0;i<40;i++){T.giveEquip(T.rollEquipDrop(60,true));}
    T.S.gachaBonus=60; for(let i=0;i<40;i++) T.doGacha();
    T.refreshHeroArt();
  });
  await p.waitForTimeout(700);
  let worst=[];
  for(const [s,nt] of SHEETS){
    for(let t=0;t<nt;t++){
      const r=await p.evaluate(async([s,t])=>{
        const T=window.__TORI; T.openSheet(s,t);
        await new Promise(r=>setTimeout(r,320));
        const bd=document.getElementById('sheetBody');
        const over=[...bd.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();
          return b.width>0&&(b.right>innerWidth+2||b.left<-2);}).length;
        // 최소 터치 타겟
        let minB=9999;
        [...bd.querySelectorAll('button')].forEach(e=>{const b=e.getBoundingClientRect();
          if(b.width>0) minB=Math.min(minB, Math.min(b.width,b.height));});
        // 텍스트 잘림 (스크롤폭 > 표시폭)
        let clip=0;
        [...bd.querySelectorAll('.nm,.tab,.sec-t')].forEach(e=>{
          if(e.scrollWidth>e.clientWidth+3) clip++;});
        return {over, minB:minB===9999?0:Math.round(minB), clip};
      },[s,t]);
      if(r.over>0||r.clip>0||(r.minB>0&&r.minB<40)) worst.push(s+t+'(넘침'+r.over+' 최소'+r.minB+' 잘림'+r.clip+')');
    }
  }
  await p.evaluate(()=>window.__TORI.closeSheet());
  console.log(D.n.padEnd(11)+' '+(worst.length? worst.join(' ') : '전부 정상')+(errs.length?'  ERR:'+errs[0].slice(0,50):''));
  await p.close();
}
await b.close();})();
