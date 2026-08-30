const {chromium}=require('playwright');
const VIEWS=[['phone',412,846,2,true],['a9plus',412,846,2.6,true],['tablet',800,1200,2,true],
             ['pc',1280,800,1,false],['land',846,412,2,true],['small',320,568,2,true]];
(async()=>{
  const b=await chromium.launch(); let errs=[];
  for(const v of VIEWS){
    const p=await b.newPage({viewport:{width:v[1],height:v[2]},deviceScaleFactor:v[3],isMobile:v[4],hasTouch:v[4]});
    p.on('pageerror',e=>errs.push('['+v[0]+'] '+e.message));
    p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push('['+v[0]+'] C:'+m.text())});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=22;T.beginPlay();
      T.S.owned={sword:1,fire:1,ice:1,leafb:1,hammer:1,bomb:1};});
    await p.waitForTimeout(900);
    // 캠프로 이동 후 전투 부하
    await p.evaluate(()=>{const T=window.__TORI,c=T.WD.camps[0];T.P.x=c.x-150;T.P.y=c.y;});
    await p.waitForTimeout(2200);
    await p.evaluate(()=>{window.__fps=[];let n=0,t0=performance.now();
      (function f(t){n++;if(t-t0>1000){window.__fps.push(n);n=0;t0=t;}requestAnimationFrame(f);})(performance.now());});
    for(let i=0;i<80;i++){
      await p.evaluate(i=>{const T=window.__TORI,P=T.P;P.invT=9;
        let e=null,bd=1e9; for(const x of T.EN){if(!x.alive||x.dead)continue;const d=Math.hypot(x.x-P.x,x.y-P.y);if(d<bd){bd=d;e=x;}}
        T.doAttack(e?e.x:P.x+140,e?e.y:P.y);
        if(i%24===0){T.S.ult=100;T.doUlt();}
        if(i%19===0)T.S.abil=['sword','fire','ice','leafb','hammer','bomb'][(i/19)|0%6];},i);
      await p.waitForTimeout(80);
    }
    const r=await p.evaluate(()=>({fps:window.__fps,q:window.__TORI.quality,dpr:window.__TORI.dpr,
      cw:document.getElementById('gc').width,ch:document.getElementById('gc').height,
      heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0}));
    const mn=Math.min(...r.fps), av=(r.fps.reduce((a,c)=>a+c,0)/r.fps.length).toFixed(1);
    console.log(`[${v[0]} ${v[1]}x${v[2]}@${v[3]}] ${r.cw}x${r.ch} (${(r.cw*r.ch/1e6).toFixed(2)}MP) fps min=${mn} avg=${av} q=${r.q} heap=${r.heap}MB`);
    await p.screenshot({path:'P2_'+v[0]+'.png'});
    await p.close();
  }
  // 하단 버튼 잘림 전수
  const p=await b.newPage({viewport:{width:412,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
  let bad=[], tight=1e9, tw=0;
  for(let w=300;w<=600;w+=2){
    await p.setViewportSize({width:w,height:800}); await p.waitForTimeout(30);
    const r=await p.evaluate(()=>{
      const f=document.getElementById('frame').getBoundingClientRect();
      const s=document.querySelector('.skill-cluster').getBoundingClientRect();
      const m=document.querySelector('.menu-cluster').getBoundingClientRect();
      const q=document.querySelector('.quest').getBoundingClientRect();
      return {sl:s.left-f.left, sr:f.right-s.right, ml:m.left-q.right, mr:f.right-m.right-10};
    });
    if(r.sr<-0.5||r.sl<-0.5||r.ml<-0.5||r.mr<-1.5) bad.push(w+`(sr${r.sr.toFixed(0)},ml${r.ml.toFixed(0)})`);
    const t=Math.min(r.sl,r.sr,r.ml); if(t<tight){tight=t;tw=w;}
  }
  console.log(bad.length? '❌ 잘림: '+bad.slice(0,8).join(' ') : '✅ 300~600px 전 구간 UI 잘림 없음 (최소여유 '+tight.toFixed(0)+'px @'+tw+'px)');
  await p.close();
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'✅ 에러 없음');
  await b.close();
})();
