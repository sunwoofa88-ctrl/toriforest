const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
// Galaxy A9(2018)/A9+ : 1080x2220 물리, DPR 2.75 → CSS 393x808
const dev={width:393,height:808,dpr:2.75};
const p=await b.newPage({viewport:{width:dev.width,height:dev.height},deviceScaleFactor:dev.dpr,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
const t0=Date.now();
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
const boot=Date.now()-t0;
const q=await p.evaluate(()=>({q:window.__TORI.quality,dpr:window.__TORI.dpr}));
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
await p.waitForTimeout(1200);

async function fps(label,setup){
  if(setup) await p.evaluate(setup);
  await p.waitForTimeout(700);
  const r=await p.evaluate(()=>new Promise(res=>{
    let n=0,worst=0,last=performance.now(),t0=last;
    function f(t){ const d=t-last; last=t; if(n>3&&d>worst)worst=d; n++;
      if(t-t0<2600) requestAnimationFrame(f); else res({fps:n/((t-t0)/1000), worst:d0(worst)}); }
    function d0(x){return Math.round(x);}
    requestAnimationFrame(f);
  }));
  return {label, fps:+r.fps.toFixed(1), worstMs:r.worst};
}
const out=[];
out.push(await fps('1장 평상시'));
out.push(await fps('적 12마리', ()=>{const T=window.__TORI,k=T.WD.camps[0].mob;for(let i=0;i<12;i++)T.spawnEnemy(k);}));
out.push(await fps('후반 90장 + 보스', ()=>{const T=window.__TORI;T.enterChapter(89);}));
out.push(await fps('풀 전투', ()=>{const T=window.__TORI,k=T.WD.camps[0].mob;for(let i=0;i<8;i++)T.spawnEnemy(k);T.S.ult=100;T.doUlt();
  for(let i=0;i<26;i++)T.doAttack(T.P.x+120,T.P.y);}));
// UI 클리핑 검사
const ui=await p.evaluate(()=>{
  const bad=[];
  const W=innerWidth,H=innerHeight;
  document.querySelectorAll('.sbtn,.tbtn,.hudTop,.hudObj,#dock,#topRight,.pill,#miniWrap').forEach(el=>{
    if(!el.offsetParent && getComputedStyle(el).position!=='fixed') return;
    const r=el.getBoundingClientRect();
    if(r.width===0||r.height===0) return;
    if(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1)
      bad.push({cls:el.className||el.id, l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom)});
  });
  // 도크 버튼끼리 겹침
  const btns=[...document.querySelectorAll('#dock .sbtn')].map(e=>e.getBoundingClientRect());
  for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){
    const a=btns[i],c=btns[j];
    if(a.left<c.right-2&&c.left<a.right-2&&a.top<c.bottom-2&&c.top<a.bottom-2) bad.push({cls:'dock겹침 '+i+'/'+j});
  }
  return {bad, W, H};
});
// 시트 4종 열어보기
const sheets=[];
for(const s of ['bag','forge','book','map','pet']){
  try{
    await p.evaluate(k=>window.__TORI.openSheet(k),s);
    await p.waitForTimeout(450);
    const r=await p.evaluate(()=>{
      const sh=document.querySelector('.sheet.on,#sheet.on,#sheet');
      if(!sh) return {ok:false};
      const rc=sh.getBoundingClientRect();
      const over=[...sh.querySelectorAll('*')].filter(e=>{
        const b=e.getBoundingClientRect();
        return b.width>0 && (b.right>innerWidth+2||b.left<-2);
      }).length;
      return {ok:true, w:Math.round(rc.width), h:Math.round(rc.height), overflow:over};
    });
    sheets.push({s, ...r});
    await p.evaluate(()=>window.__TORI.closeSheet());
    await p.waitForTimeout(200);
  }catch(e){ sheets.push({s,err:String(e).slice(0,60)}); }
}
const mem=await p.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):-1);
await p.screenshot({path:'A9_portrait.png'});
// 가로 모드
await p.setViewportSize({width:808,height:393});
await p.waitForTimeout(900);
await p.screenshot({path:'A9_land.png'});
const ui2=await p.evaluate(()=>{
  const bad=[];const W=innerWidth,H=innerHeight;
  document.querySelectorAll('.sbtn,.tbtn,.hudTop,.hudObj,#dock,#topRight,#miniWrap').forEach(el=>{
    const r=el.getBoundingClientRect(); if(r.width===0)return;
    if(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1) bad.push(el.className||el.id);
  });
  return bad;
});
console.log('=== 갤럭시 A9+ (393x808 CSS, DPR 2.75) ===');
console.log('부팅', boot+'ms   QUALITY='+q.q+'   실제DPR='+q.dpr.toFixed(2)+'   힙 '+mem+'MB');
out.forEach(r=>console.log('  '+r.label.padEnd(16)+' '+String(r.fps).padStart(5)+' fps   최악프레임 '+r.worstMs+'ms'));
console.log('세로 UI 벗어남:', ui.bad.length? JSON.stringify(ui.bad):'없음');
console.log('가로 UI 벗어남:', ui2.length? JSON.stringify(ui2):'없음');
console.log('시트:', sheets.map(s=>s.s+(s.ok?('('+s.w+'x'+s.h+',넘침'+s.overflow+')'):'실패')).join(' '));
console.log(errs.length?'ERR '+errs.join('|'):'에러 없음');
await b.close();})();
