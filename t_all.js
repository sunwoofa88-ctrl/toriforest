const {chromium}=require('playwright');
const DEVICES=[
 {n:'소형폰 320',      w:320, h:640, d:2,    m:1},
 {n:'갤A9+ 393',      w:393, h:808, d:2.75, m:1},
 {n:'갤S22+ 412',     w:412, h:915, d:3,    m:1},
 {n:'폰 가로 808',     w:808, h:393, d:2.75, m:1},
 {n:'태블릿 800x1280', w:800, h:1280,d:2,    m:1},
 {n:'태블릿 가로 1280',w:1280,h:800, d:2,    m:1},
 {n:'PC 1440x900',    w:1440,h:900, d:1,    m:0}
];
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
console.log('기기                 부팅   Q  DPR   평상  전투  후반  최악ms  힙MB  UI벗어남  시트넘침');
for(const D of DEVICES){
  const p=await b.newPage({viewport:{width:D.w,height:D.h},deviceScaleFactor:D.d,isMobile:!!D.m,hasTouch:!!D.m});
  const errs=[]; p.on('pageerror',e=>{if(errs.indexOf(e.message)<0)errs.push(e.message)});
  const t0=Date.now();
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
  const boot=Date.now()-t0;
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
  await p.waitForTimeout(1000);
  async function fps(setup){
    if(setup) await p.evaluate(setup);
    await p.waitForTimeout(600);
    return await p.evaluate(()=>new Promise(res=>{
      let n=0,worst=0,last=performance.now(),t0=last;
      function f(t){const d=t-last;last=t;if(n>3&&d>worst)worst=d;n++;
        if(t-t0<2200)requestAnimationFrame(f);else res({fps:n/((t-t0)/1000),worst:Math.round(worst)});}
      requestAnimationFrame(f);}));
  }
  const a=await fps();
  const c=await fps(()=>{const T=window.__TORI,k=T.WD.camps[0].mob;for(let i=0;i<10;i++)T.spawnEnemy(k);
    T.S.ult=100;T.doUlt();for(let i=0;i<20;i++)T.doAttack(T.P.x+120,T.P.y);});
  const l=await fps(()=>{const T=window.__TORI;T.enterChapter(102);});
  const worst=Math.max(a.worst,c.worst,l.worst);
  const q=await p.evaluate(()=>({q:window.__TORI.quality,dpr:window.__TORI.dpr,
    mem:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):-1}));
  const ui=await p.evaluate(()=>{let n=0;const W=innerWidth,H=innerHeight;
    document.querySelectorAll('.sbtn,.tbtn,.hudTop,.hudObj,#dock,#topRight,#miniWrap').forEach(e=>{
      const r=e.getBoundingClientRect(); if(r.width===0)return;
      if(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1)n++;});
    const btns=[...document.querySelectorAll('#dock .sbtn')].map(e=>e.getBoundingClientRect());
    for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){const x=btns[i],y=btns[j];
      if(x.left<y.right-2&&y.left<x.right-2&&x.top<y.bottom-2&&y.top<x.bottom-2)n++;}
    return n;});
  let sov=0;
  for(const s of ['bag','forge','book','map','pet']){
    await p.evaluate(k=>window.__TORI.openSheet(k),s); await p.waitForTimeout(320);
    sov+=await p.evaluate(()=>{const sh=document.querySelector('#sheet');if(!sh)return 0;
      return [...sh.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();
        return b.width>0&&(b.right>innerWidth+2||b.left<-2);}).length;});
    await p.evaluate(()=>window.__TORI.closeSheet()); await p.waitForTimeout(150);
  }
  console.log(D.n.padEnd(20)+String(boot+'ms').padStart(6)+'  '+q.q+'  '+q.dpr.toFixed(2)+
    '  '+a.fps.toFixed(0).padStart(4)+'  '+c.fps.toFixed(0).padStart(4)+'  '+l.fps.toFixed(0).padStart(4)+
    '   '+String(worst).padStart(4)+'   '+String(q.mem).padStart(4)+'    '+String(ui).padStart(4)+'      '+String(sov).padStart(4)+
    (errs.length?'  ERR:'+errs[0].slice(0,40):''));
  await p.close();
}
await b.close();})();
