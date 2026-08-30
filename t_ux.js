const {chromium}=require('playwright');
/* UI 전수 사용성 조사 : 사람이 실제로 만지는 관점으로 검사 */
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const DEV=[{n:'320',w:320,h:640,d:2},{n:'A9+ 393',w:393,h:808,d:2.75},{n:'412',w:412,h:846,d:3},
           {n:'가로 808',w:808,h:393,d:2.75},{n:'태블릿 800',w:800,h:1280,d:2},{n:'PC 1440',w:1440,h:900,d:1}];
const issues=[];
function add(dev,where,msg){ issues.push('['+dev+'] '+where+' : '+msg); }
for(const D of DEV){
  const p=await b.newPage({viewport:{width:D.w,height:D.h},deviceScaleFactor:D.d,isMobile:D.w<700,hasTouch:D.w<700});
  p.on('pageerror',e=>add(D.n,'JS','에러 '+e.message.slice(0,60)));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.S.acorn=999999;T.S.star=3000;T.beginPlay();
    for(let i=0;i<30;i++) T.giveEquip(T.rollEquipDrop(60,true));
    T.S.gachaBonus=40; for(let i=0;i<30;i++) T.doGacha();
    for(const m of T.MAT_IDS) T.S.mat[m]=9;
    T.refreshHeroArt();});
  await p.waitForTimeout(800);

  /* 1. 인게임 조작 버튼 크기 (손가락 최소 44px 권장) */
  const play=await p.evaluate(()=>{
    const out=[];
    document.querySelectorAll('#dock .sbtn,.mbtn,#btnSound,.xbtn').forEach(e=>{
      const r=e.getBoundingClientRect(); if(r.width<1) return;
      out.push({id:e.id||e.className, w:Math.round(r.width), h:Math.round(r.height)});
    });
    return out;
  });
  play.forEach(x=>{ if(Math.min(x.w,x.h)<40) add(D.n,'조작버튼', x.id+' 가 '+x.w+'x'+x.h+' 로 작음'); });

  /* 2. 조이스틱 영역이 버튼과 겹치는지 */
  const js=await p.evaluate(()=>{
    const d=document.querySelector('.dock').getBoundingClientRect();
    const sc=document.querySelector('.skill-cluster').getBoundingClientRect();
    return {dockW:d.width, skillLeft:sc.left, dockLeft:d.left, W:innerWidth,
            joyRight:sc.left};
  });
  if(js.joyRight < js.W*0.30) add(D.n,'조이스틱','걷는 영역이 화면의 '+Math.round(js.joyRight/js.W*100)+'% 뿐');

  /* 3. 모든 시트 : 스크롤 필요 여부 · 첫 화면에 핵심 버튼이 보이는지 */
  for(const [s,nt] of [['bag',2],['gear',3],['pet',3],['make',3],['book',3],['map',1]]){
    for(let t=0;t<nt;t++){
      const r=await p.evaluate(async([s,t])=>{
        const T=window.__TORI; T.openSheet(s,t);
        await new Promise(r=>setTimeout(r,300));
        const bd=document.getElementById('sheetBody');
        const br=bd.getBoundingClientRect();
        const btns=[...bd.querySelectorAll('button')];
        let small=0, offscreen=0, minB=9999;
        btns.forEach(e=>{const q=e.getBoundingClientRect();
          if(q.width<1) return;
          minB=Math.min(minB,Math.min(q.width,q.height));
          if(Math.min(q.width,q.height)<40) small++;
          if(q.top>br.bottom) offscreen++;});
        // 주요 액션 버튼(bigbtn/bestbtn)이 스크롤 없이 보이는가
        // '초기화' 같은 되돌릴 수 없는 버튼은 일부러 맨 아래 두므로 제외
        const cand=[...bd.querySelectorAll('.bigbtn,.bestbtn')]
          .filter(e=>e.textContent.indexOf('처음부터')<0 && e.textContent.indexOf('초기화')<0);
        const main=cand[0]||null;
        const mainVisible = main? (main.getBoundingClientRect().top < br.bottom-10) : null;
        // 가로 넘침
        const over=[...bd.querySelectorAll('*')].filter(e=>{const q=e.getBoundingClientRect();
          return q.width>0&&(q.right>innerWidth+2||q.left<-2);}).length;
        return {small, minB:minB===9999?0:Math.round(minB), mainVisible, over,
                scrollH:bd.scrollHeight, viewH:Math.round(br.height), n:btns.length};
      },[s,t]);
      if(r.over>0) add(D.n,s+t,'가로로 '+r.over+'개 넘침');
      if(r.small>0) add(D.n,s+t,r.small+'개 버튼이 40px 미만 (최소 '+r.minB+')');
      if(r.mainVisible===false) add(D.n,s+t,'주요 버튼이 스크롤해야 보임');
      if(r.viewH<120) add(D.n,s+t,'내용 영역이 '+r.viewH+'px 뿐');
    }
  }
  await p.evaluate(()=>window.__TORI.closeSheet());

  /* 4. 시트 닫기 버튼이 엄지로 닿는 위치인가 (상단이면 큰 화면에서 멀다) */
  const xb=await p.evaluate(()=>{
    const e=document.querySelector('.xbtn'); const r=e.getBoundingClientRect();
    const cb=document.querySelector('.closebar');
    const cr=cb? cb.getBoundingClientRect():null;
    return {top:Math.round(r.top), h:innerHeight,
      bottomClose: cr? {top:Math.round(cr.top), w:Math.round(cr.width), hh:Math.round(cr.height)} : null};});
  if(!xb.bottomClose) add(D.n,'닫기버튼','아래쪽 닫기 버튼이 없다');
  else if(xb.bottomClose.hh<40) add(D.n,'닫기버튼','아래 닫기 버튼이 '+xb.bottomClose.hh+'px 로 작다');
  else if(xb.bottomClose.top < xb.h*0.55) add(D.n,'닫기버튼','아래 닫기 버튼이 화면 위쪽('+xb.bottomClose.top+'px)에 있다');

  /* 5. 글자 크기 */
  const fs=await p.evaluate(()=>{
    const g=(sel)=>{const e=document.querySelector(sel); return e? parseFloat(getComputedStyle(e).fontSize):0;};
    return {nm:g('.cell .nm'), info:g('.info'), tab:g('.tab'), mbtn:g('.mbtn span'), cap:g('.skill-cap')};
  });
  for(const k in fs) if(fs[k]>0 && fs[k]<11) add(D.n,'글자크기', k+' 가 '+fs[k].toFixed(1)+'px');

  await p.close();
}
console.log('=== UI 사용성 전수 조사 ===');
if(!issues.length) console.log('불편한 점 없음');
else issues.forEach(x=>console.log('  ⚠ '+x));
console.log('총 '+issues.length+'건');
await b.close();})();
