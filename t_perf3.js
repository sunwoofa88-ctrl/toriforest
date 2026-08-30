const {chromium}=require('playwright');
const VIEWS=[['phone',412,846,2,true],['a9plus',412,846,2.6,true],['tablet',800,1200,2,true],
             ['pc',1280,800,1,false],['land',846,412,2,true],['small',320,568,2,true]];
(async()=>{
  const b=await chromium.launch(); let errs=[];
  for(const v of VIEWS){
    const p=await b.newPage({viewport:{width:v[1],height:v[2]},deviceScaleFactor:v[3],isMobile:v[4],hasTouch:v[4]});
    p.on('pageerror',e=>{const m='['+v[0]+'] '+e.message; if(errs.indexOf(m)<0)errs.push(m)});
    p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text())){const t='['+v[0]+'] '+m.text().slice(0,110); if(errs.indexOf(t)<0)errs.push(t)}});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=70;T.beginPlay();
      Object.keys(T.ABIL).forEach(a=>{T.S.owned[a]=1;});
      T.enterChapter(55);});
    await p.waitForTimeout(1400);
    await p.evaluate(()=>{const T=window.__TORI,c=T.WD.camps[0];T.P.x=c.x-140;T.P.y=c.y;});
    await p.waitForTimeout(2400);
    await p.evaluate(()=>{window.__fps=[];let n=0,t0=performance.now();
      (function f(t){n++;if(t-t0>1000){window.__fps.push(n);n=0;t0=t;}requestAnimationFrame(f);})(performance.now());});
    const ids=await p.evaluate(()=>Object.keys(window.__TORI.ABIL));
    for(let i=0;i<80;i++){
      await p.evaluate(([i,ids])=>{const T=window.__TORI,P=T.P;P.invT=9;
        if(i%7===0) T.S.abil=ids[(i*13)%ids.length];
        let e=null,bd=1e9;for(const x of T.EN){if(!x.alive||x.dead)continue;const d=Math.hypot(x.x-P.x,x.y-P.y);if(d<bd){bd=d;e=x;}}
        T.doAttack(e?e.x:P.x+150,e?e.y:P.y);
        if(i%25===0){T.S.ult=100;T.doUlt();}},[i,ids]);
      await p.waitForTimeout(80);
    }
    const r=await p.evaluate(()=>({fps:window.__fps,q:window.__TORI.quality,
      cw:document.getElementById('gc').width,ch:document.getElementById('gc').height,
      heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0, cache:window.__TORI.cacheSize()}));
    const mn=Math.min(...r.fps), av=(r.fps.reduce((a,c)=>a+c,0)/r.fps.length).toFixed(1);
    console.log(`[${v[0]} ${v[1]}x${v[2]}@${v[3]}] ${(r.cw*r.ch/1e6).toFixed(2)}MP fps min=${mn} avg=${av} q=${r.q} heap=${r.heap}MB cache=${JSON.stringify(r.cache)}`);
    await p.screenshot({path:'W_'+v[0]+'.png'});
    await p.close();
  }
  // UI 잘림
  const p=await b.newPage({viewport:{width:412,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
  let bad=[],tight=1e9,tw=0;
  for(let w=300;w<=600;w+=2){
    await p.setViewportSize({width:w,height:800}); await p.waitForTimeout(28);
    const r=await p.evaluate(()=>{const f=document.getElementById('frame').getBoundingClientRect();
      const s=document.querySelector('.skill-cluster').getBoundingClientRect();
      const m=document.querySelector('.menu-cluster').getBoundingClientRect();
      const q=document.querySelector('.quest').getBoundingClientRect();
      return {sl:s.left-f.left,sr:f.right-s.right,ml:m.left-q.right,mr:f.right-m.right-10};});
    if(r.sr<-0.5||r.sl<-0.5||r.ml<-0.5||r.mr<-1.5) bad.push(w);
    const t=Math.min(r.sl,r.sr,r.ml); if(t<tight){tight=t;tw=w;}
  }
  console.log(bad.length?'❌ 잘림 폭: '+bad.slice(0,10).join(','):'✅ 300~600px UI 잘림 없음 (최소여유 '+tight.toFixed(0)+'px @'+tw+')');
  await p.close();
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'✅ 에러 없음');
  await b.close();
})();
