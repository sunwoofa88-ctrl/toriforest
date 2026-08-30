const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI,S=T.S;T.S.lv=55;T.beginPlay();
   const want={}; for(const id of T.EQ_IDS){const E=T.EQUIP[id]; if(!E)continue; if(want[E.slot]===undefined)want[E.slot]=id;}
   for(const sl in want) T.giveEquip(want[sl]);
   const map={0:'w',1:'a',2:'h',3:'c',4:'g',5:'b',6:'r1',7:'n'};
   const on={}; for(const sl in want){const k=map[sl]; if(k)on[k]=want[sl];}
   on.r2=want[6];
   Object.assign(S.eq||(S.eq={}),on); S.eqW=on.w; S.eqA=on.a; T.refreshHeroArt();});
 await p.waitForTimeout(600);
 await p.evaluate(()=>window.__TORI.openSheet('gear'));
 await p.waitForTimeout(700);
 /* 착용 상태 영역이 보이게 스크롤 */
 await p.evaluate(()=>{ const b=document.querySelector('.sheet-bd'); const d=document.querySelector('.doll');
   if(b&&d) b.scrollTop = d.offsetTop - 20; });
 await p.waitForTimeout(300);
 await p.screenshot({path:'/tmp/gearfull.png'});
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
