const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
await p.waitForTimeout(700);

// 1) 등급/확률 검증 : 3만회
const sim=await p.evaluate(()=>{
  const T=window.__TORI;
  const cnt=new Array(T.PET_GRADE.length).fill(0);
  T.S.gacha={day:T.__today(),used:0,total:0,pity:0,pityL:0};
  T.S.gachaBonus=100000;
  let maxGapU=0,maxGapL=0,gu=0,gl=0;
  for(let i=0;i<30000;i++){
    const r=T.doGacha(); if(!r){break;}
    cnt[r.grade]++;
    gu++; gl++;
    if(r.grade>=3){ if(gu>maxGapU)maxGapU=gu; gu=0; }
    if(r.grade>=4){ if(gl>maxGapL)maxGapL=gl; gl=0; }
  }
  const tot=cnt.reduce((a,c)=>a+c,0);
  return {cnt, tot, maxGapU, maxGapL,
          names:T.PET_GRADE.map(g=>g.n), rates:T.PET_GRADE.map(g=>g.rate),
          species:Object.keys(T.PETS).length, owned:Object.keys(T.S.pets).length};
});
console.log('=== 펫 뽑기 3만회 ===');
sim.names.forEach((n,i)=>{
  const pct=sim.cnt[i]/sim.tot*100;
  console.log('  '+n.padEnd(4)+' 목표 '+String(sim.rates[i]).padStart(5)+'%   실제 '+pct.toFixed(2)+'%   ('+sim.cnt[i]+'회)');
});
console.log('  유니크 이상 최대 간격 '+sim.maxGapU+'회 (천장 30)');
console.log('  전설  이상 최대 간격 '+sim.maxGapL+'회 (천장 150)');
console.log('  펫 종류 '+sim.species+'종 / 보유 '+sim.owned+'종');

// 2) 조합 검증
const fuse=await p.evaluate(()=>{
  const T=window.__TORI;
  const out={up:0,same:0,fail:0,tries:0, before:0, after:0};
  for(let g=0; g<5; g++){
    const pool=T.PET_BY_GRADE[g].filter(id=>T.fuseUsable(id)>=1);
    for(let t=0;t<40;t++){
      const pick=[];
      for(const id of T.PET_BY_GRADE[g]){
        let u=T.fuseUsable(id);
        while(u-->0 && pick.length<3) pick.push(id);
        if(pick.length>=3) break;
      }
      if(pick.length<3) break;
      const n0=Object.values(T.S.pets).reduce((a,c)=>a+c,0);
      const r=T.doPetFuse(pick);
      out.tries++;
      if(!r){ out.fail++; break; }
      const n1=Object.values(T.S.pets).reduce((a,c)=>a+c,0);
      if(n1!==n0-2) return {err:'수량 오류 '+n0+'→'+n1};
      if(r.grade>g) out.up++; else out.same++;
    }
  }
  return out;
});
console.log('=== 펫 조합 ===');
console.log('  '+JSON.stringify(fuse));

// 3) UI 열림 검증
const ui=await p.evaluate(async()=>{
  const T=window.__TORI, out={};
  for(let t=0;t<3;t++){
    T.openSheet('pet',t);
    await new Promise(r=>setTimeout(r,260));
    const body=document.getElementById('sheetBody');
    out['tab'+t]={kids:body.children.length, h:body.scrollHeight,
      over:[...body.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();
        return b.width>0&&(b.right>innerWidth+2||b.left<-2);}).length};
  }
  T.closeSheet();
  return out;
});
console.log('=== 펫 화면 ===');
console.log('  '+JSON.stringify(ui));

// 4) 연출 동작
const fx=await p.evaluate(async()=>{
  const T=window.__TORI;
  T.openSheet('pet',1);
  await new Promise(r=>setTimeout(r,260));
  T.S.gachaBonus=5;
  const btn=[...document.querySelectorAll('#sheetBody .bigbtn')][0];
  btn.click();
  await new Promise(r=>setTimeout(r,400));
  const ov=document.querySelector('.reveal');
  const r={shown:!!ov, rays:!!document.querySelector('.rv-rays'), sp:document.querySelectorAll('.rv-sp').length};
  if(ov) ov.click();
  await new Promise(r=>setTimeout(r,400));
  r.closed=!document.querySelector('.reveal');
  T.closeSheet();
  return r;
});
console.log('=== 뽑기 연출 ===');
console.log('  '+JSON.stringify(fx));
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
