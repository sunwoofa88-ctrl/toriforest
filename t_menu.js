const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:412,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
await p.evaluate(()=>{const T=window.__TORI;T.S.lv=50;T.S.acorn=99999999;T.beginPlay();});
await p.waitForTimeout(600);
const bad=[];
for(let w=300;w<=600;w+=4){
  await p.setViewportSize({width:w,height:800});
  await p.waitForTimeout(40);
  const r=await p.evaluate(()=>{
    const f=document.getElementById('frame').getBoundingClientRect();
    const m=document.querySelector('.menu-cluster').getBoundingClientRect();
    const q=document.querySelector('.quest').getBoundingClientRect();
    const zn=document.getElementById('uiZone'), st=document.getElementById('uiStage');
    const btns=[...document.querySelectorAll('.menu-cluster .mbtn')].map(e=>e.getBoundingClientRect());
    let ov=0;
    for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){
      const a=btns[i],c=btns[j];
      if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1) ov++;
    }
    return {mR:f.right-m.right, mL:m.left-f.left, gap:m.top-q.bottom, ov, hudH:document.querySelector('.hud').getBoundingClientRect().height,
      minW:btns.length?Math.min(...btns.map(b=>b.width)):0,
      znClip: zn.scrollWidth>zn.clientWidth+2, stClip: st.scrollWidth>st.clientWidth+2,
      qW:Math.round(q.width)};
  });
  if(r.mR<-0.5||r.mL<-0.5||r.gap<-0.5||r.ov>0||r.znClip||r.stClip||r.minW<42||r.hudH>230)
    bad.push(w+'(R'+r.mR.toFixed(0)+' 간격'+r.gap.toFixed(0)+' 겹'+r.ov+' 최소'+r.minW.toFixed(0)+' HUD'+Math.round(r.hudH)+(r.znClip?' 지역잘림':'')+(r.stClip?' 진행잘림':'')+')');
}
console.log('300~600px 상단 메뉴 검사: '+(bad.length? bad.slice(0,12).join(' ') : '전부 정상'));
await b.close();})();
