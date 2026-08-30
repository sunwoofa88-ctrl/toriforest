const {chromium}=require('playwright');
const VIEWS=[
  {n:'phone', w:412,h:846, dsf:2, mobile:true},
  {n:'a9plus', w:412,h:846, dsf:2.6, mobile:true},
  {n:'tablet', w:800,h:1200, dsf:2, mobile:true},
  {n:'pc', w:1280,h:800, dsf:1, mobile:false},
  {n:'land', w:846,h:412, dsf:2, mobile:true}
];
(async()=>{
  const b=await chromium.launch();
  let errsAll=[];
  for(const v of VIEWS){
    const p=await b.newPage({viewport:{width:v.w,height:v.h},deviceScaleFactor:v.dsf,isMobile:v.mobile,hasTouch:v.mobile});
    const errs=[]; p.on('pageerror',e=>errs.push('['+v.n+'] '+e.message));
    p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push('['+v.n+'] C:'+m.text());});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000}).catch(()=>errs.push(v.n+' BOOT TIMEOUT'));
    await p.evaluate(()=>window.__TORI.beginPlay());
    await p.evaluate(()=>{ const S=window.__TORI.S; S.lv=20; S.acorn=99999; S.star=999;
      ['sword','fire','ice','leafb','hammer','bomb'].forEach(a=>{S.owned[a]=1;S.cards[a]=9;}); });
    await p.waitForTimeout(900);
    await p.evaluate(()=>{ window.__fps=[]; let n=0,t0=performance.now();
      (function f(t){n++;if(t-t0>1000){window.__fps.push(n);n=0;t0=t;}requestAnimationFrame(f);})(performance.now()); });
    // 현실적인 부하: 아이가 마구 탭하는 수준 (초당 ~8탭) + 가끔 필살기
    for(let i=0;i<80;i++){
      await p.evaluate(i=>{const T=window.__TORI;let e=null;
        for(const x of T.EN){if(x.alive&&!x.dead){e=x;break;}}
        T.doAttack(e?e.x:T.P.x+150, e?e.y-e.size*0.5:T.P.y-60);
        if(i%26===0){T.S.ult=100;T.doUlt();}
        if(i%17===0){T.S.abil=['sword','fire','ice','leafb','hammer','bomb'][(i/17)|0%6];}
      },i);
      await p.waitForTimeout(80);
    }
    const r=await p.evaluate(()=>({fps:window.__fps,dpr:window.__TORI.dpr,q:window.__TORI.quality}));
    const info=await p.evaluate(()=>{const c=document.getElementById('gc');return{cw:c.width,ch:c.height};});
    const mn=Math.min(...r.fps), av=(r.fps.reduce((a,c)=>a+c,0)/r.fps.length).toFixed(1);
    console.log(`[${v.n} ${v.w}x${v.h}@${v.dsf}] backbuffer=${info.cw}x${info.ch} (${(info.cw*info.ch/1e6).toFixed(2)}MP)  fps min=${mn} avg=${av}`);
    await p.screenshot({path:'p_'+v.n+'.png'});
    errsAll=errsAll.concat(errs); await p.close();
  }
  console.log(errsAll.length?'ERRORS:\n'+errsAll.join('\n'):'NO ERRORS');
  await b.close();
})();
