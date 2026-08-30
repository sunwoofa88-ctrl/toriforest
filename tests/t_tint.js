/* 실전에서 틴트 캐시가 상한(150)에 부딪히는가 → 부딪히면 이펙트가 흰색으로 나간다 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1.5});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
 await p.waitForTimeout(1500);
 const log=[];
 for(let i=0;i<8;i++){
   await p.evaluate(()=>{const T=window.__TORI;
     for(let k=0;k<6;k++)T.spawnEnemy();
     for(let k=0;k<12;k++){let g=null,d=1e9;
       for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
       if(g)T.doAttack(g.x,g.y-g.size*0.5);}
     T.S.ult=100; if(k=>0) {} });
   await p.waitForTimeout(1400);
   log.push(await p.evaluate(()=>window.__TORI.dbg.aqStat().tint));
 }
 // 룬 마법진이 실제로 색을 먹는가 직접 확인
 const col=await p.evaluate(()=>{
   const T=window.__TORI, t=T.dbg;
   const src=T.SPR.fx.runeC;
   const out={tint:t.aqStat().tint};
   // tintSpr 직접 호출 결과의 평균색
   const f=t.tintSpr? t.tintSpr(src,'#2E86FF') : null;
   if(!f){ out.err='tintSpr 미노출'; return out; }
   out.same = (f===src);
   const c=document.createElement('canvas'); c.width=f.width;c.height=f.height;
   const g=c.getContext('2d'); g.drawImage(f,0,0);
   const d=g.getImageData(0,0,f.width,f.height).data;
   let r=0,gg=0,bb=0,n=0;
   for(let i=0;i<d.length;i+=4){ if(d[i+3]>40){r+=d[i];gg+=d[i+1];bb+=d[i+2];n++;} }
   out.avg=[Math.round(r/n),Math.round(gg/n),Math.round(bb/n)]; out.n=n;
   return out;
 });
 console.log('틴트 캐시 추이:',log.join(' → '));
 console.log('룬 틴트 결과:',JSON.stringify(col));
 await b.close();
})();
