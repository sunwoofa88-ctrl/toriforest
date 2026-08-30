const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 for(const roam of [1,0]){
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>{const T=window.__TORI;
    let lob=null; for(const a in T.ABIL) if(T.ABIL[a].kind==='lob'){lob=a;break;}
    T.S.owned[lob]=1;T.S.abil=lob;T.S.lv=20;T.beginPlay();});
  await p.evaluate(v=>window.__TORI.dbg.setRoam(v),roam);
  await p.waitForTimeout(600);
  const r=await p.evaluate(async()=>{
    const T=window.__TORI;
    for(const e of T.EN) e.alive=false;
    const e=T.spawnEnemy(T.WD.camps[0].mob,1);
    e.x=T.P.x+460; e.y=T.P.y; e.hp=e.hpMax=99999;
    const before=e.hp;
    for(let i=0;i<8;i++){ T.doAttack(e.x,e.y-e.size*0.5); await new Promise(r=>setTimeout(r,700)); }
    return {before,after:e.hp,abil:T.S.abil,others:T.EN.filter(x=>x.alive&&!x.dead&&x!==e).length};
  });
  console.log(`roam=${roam}  ${r.abil}  ${r.before}→${r.after}  ${r.after<r.before?'✅맞음':'❌안맞음'}  (사이에 낀 다른 몬스터 ${r.others}마리)`);
  await p.close();
 }
 await b.close();
})();
