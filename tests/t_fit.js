const {chromium}=require('playwright');
const DEVS=[{n:'A9+ 가로',w:1280,h:800,d:1.5},{n:'A9+ 세로',w:800,h:1280,d:1.5},{n:'폰 세로',w:393,h:808,d:2.75},{n:'폰 가로',w:720,h:360,d:3}];
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  for(const D of DEVS){
    const p=await b.newPage({viewport:{width:D.w,height:D.h},deviceScaleFactor:D.d,isMobile:true,hasTouch:true});
    await p.goto('file:///root/toriforest/dotorisup.html');
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:180000});
    await p.evaluate(()=>{const T=window.__TORI;T.S.lv=45;T.beginPlay();});
    await p.waitForTimeout(900);
    await p.evaluate(()=>{const T=window.__TORI; T.S.eq=T.S.eq||{}; T.S.eqOn=T.S.eqOn||{};
      const pick={}; for(const k in T.EQUIP){const e=T.EQUIP[k]; if(pick[e.slot])continue; if(e.grade>=3){pick[e.slot]=k;T.S.eq[k]=1;} }
      const sl=['w','a','h','c','g','b','r1','r2','n']; let i=0; for(const k in pick){T.S.eqOn[sl[i++]]=pick[k];} T.needSync=1;});
    await p.evaluate(()=>window.__TORI.openSheet('gear'));
    await p.waitForTimeout(700);
    const m=await p.evaluate(()=>{
      const bd=document.querySelector('.sheet-bd')||document.querySelector('.sheet .bd')||document.querySelector('#sheetBody');
      const gv=document.querySelector('.gearv');
      const r=el=>el?el.getBoundingClientRect():null;
      const sb=bd? {ch:bd.clientHeight, sh:bd.scrollHeight} : null;
      const g=r(gv);
      const st=r(document.querySelector('.gv-stats'));
      const slot=r(document.querySelector('.gvslot'));
      return {sb, gvH:g?Math.round(g.height):0, statsBottom:st?Math.round(st.bottom):0,
        slotW:slot?Math.round(slot.width):0, slotH:slot?Math.round(slot.height):0,
        winH:innerHeight};
    });
    const over = m.sb? (m.sb.sh - m.sb.ch) : -1;
    console.log(`${D.n.padEnd(9)} 시트본문 ${m.sb?m.sb.ch:'?'}px / 내용 ${m.sb?m.sb.sh:'?'}px  → 넘침 ${over}px   슬롯 ${m.slotW}x${m.slotH}  능력치하단 ${m.statsBottom} (화면 ${m.winH})`);
    await p.close();
  }
  await b.close();
})();
