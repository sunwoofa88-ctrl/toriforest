/* 실제 플레이 시뮬레이션 : 난이도 곡선을 수치로 측정한다 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const p=await ctx.newPage();
p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
await p.goto(F);
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(600);

const rows = await p.evaluate(async()=>{
  const T=window.__TORI, out=[];
  /* 순수 계산으로 지표를 뽑는다 (실시간 전투는 너무 느려서 표본이 안 나온다) */
  function playerDps(){
    const a=T.S.abil, A=T.ABIL[a];
    const t=(function(){ try{ return T.dbg.abilTier? T.dbg.abilTier(a):0; }catch(e){ return 0; } })();
    return null;
  }
  for(const c of [0,4,9,19,29,49,69,89,109]){
    T.S.prog={}; T.S.chap=c; T.enterChapter(c);
    /* 그 장에 나오는 일반 몬스터 한 마리를 실제로 소환해 능력치를 읽는다 */
    const mobs=T.chapMobs(c);
    const e=T.spawnEnemy(mobs[0]);
    await new Promise(z=>setTimeout(z,60));
    const bossKey=T.chapBoss(c);
    const rec={chap:c+1, lv:T.S.lv, hp:0, mobHp:e?e.hpMax:0, mobAtk:e?e.atk:0,
               need:T.chapKillNeed(c), mob:mobs[0], boss:bossKey};
    rec.hp=(function(){ try{ return T.dbg.maxHp? T.dbg.maxHp():0; }catch(x){ return 0; } })();
    out.push(rec);
    if(e){ e.alive=false; }
  }
  return out;
});
console.log(JSON.stringify(rows,null,1));
console.log(p.__errs.length? 'ERR '+p.__errs.join('|'):'에러 없음');
await b.close();})();
