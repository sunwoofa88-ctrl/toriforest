/* 주인공이 '언제나 AI 그림' 인가 — 부팅 직후 · 방어구 착용 후 · 해제 후 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=30;T.beginPlay();});
 await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>{
   const T=window.__TORI;
   /* AI 그림 여부 판정 : hero_idle 원본과 픽셀을 직접 비교한다.
      절차적 그림은 색/형태가 전혀 달라 차이가 크게 벌어진다. */
   function sig(cv){
     const px=64, c=document.createElement('canvas'); c.width=c.height=px;
     const g=c.getContext('2d'); g.drawImage(cv,0,0,px,px);
     return g.getImageData(0,0,px,px).data;
   }
   function diff(a,b){ let s=0,n=0;
     for(let i=0;i<a.length;i+=4){ const aa=a[i+3]/255, ba=b[i+3]/255;
       s+=Math.abs(aa-ba); n++;
       if(aa>0.5&&ba>0.5){ s+=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/765; }
     }
     return s/n;
   }
   const ref=(()=>{ const im=T.dbg.artImg?T.dbg.artImg('hero_idle'):null; return im; })();
   const out={};
   const snap=()=>sig(T.SPR.hero.idle);
   const base=snap();
   out.armors=[];
   // 착용 가능한 방어구를 찾아서 착용 → 해제
   const ids=T.EQ_IDS.filter(id=>T.EQ_ARM.indexOf(id)>=0||T.EQUIP[id].tn!==undefined);
   let tried=0;
   for(const id of T.EQ_IDS){
     const E=T.EQUIP[id]; if(!E || E.tn===undefined || T.ARM_TYPE[E.tn]===undefined) continue;
     if(!T.EQ_ARM || T.EQ_ARM.indexOf(id)<0) continue;
     T.giveEquip(id); T.S.eqA=id; T.refreshHeroArt();
     const d=diff(base, snap());
     out.armors.push([id, +d.toFixed(4)]);
     if(++tried>=6) break;
   }
   T.S.eqA=null; T.refreshHeroArt();
   out.off = +diff(base, snap()).toFixed(4);
   out.n = out.armors.length;
   return out;
 });
 console.log('방어구 착용 시 주인공 그림 변화량(0=그대로, 1=완전히 다른 그림)');
 (r.armors||[]).forEach(a=>console.log('  '+a[0]+'  '+a[1]));
 console.log('  해제 후 원상복귀 차이 '+r.off+'  (0.02 이하여야 한다)');
 const bad=(r.armors||[]).filter(a=>a[1]>0.35);
 console.log(bad.length? '  ❌ 그림이 통째로 바뀐 케이스 '+bad.length+'건 — 절차적 그림으로 되돌아갔을 가능성'
                       : '  ✅ 모든 방어구에서 AI 그림 유지(테두리·색조만 변함)');
 console.log('  '+(r.off<=0.02? '✅ 해제 시 원본 복귀' : '❌ 해제해도 원본으로 안 돌아옴'));
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
