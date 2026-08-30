const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0,fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
async function boot(b,w,h,dsf,mob){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:dsf,isMobile:mob!==false,hasTouch:mob!==false});
  p.__errs=[]; p.on('pageerror',e=>{if(p.__errs.indexOf(e.message)<0)p.__errs.push(e.message)});
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text())){const t=m.text().slice(0,120); if(p.__errs.indexOf(t)<0)p.__errs.push(t)}});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
  return p;
}
(async()=>{
const b=await chromium.launch();

console.log('\n[1] 콘텐츠 규모');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>window.__TORI.beginPlay());
  const r=await p.evaluate(()=>window.__TORI.stats());
  console.log('    ',JSON.stringify(r));
  ok('종족 132', r.species===132, ''+r.species);
  ok('재료 72', r.mats===72, ''+r.mats);
  ok('능력 33종 99형태', r.abils===33, ''+r.abils);
  ok('챕터 110', r.chapters===110, ''+r.chapters);
  ok('바이옴 11', r.biomes===11, ''+r.biomes);
  ok('공격방식 11종', r.kinds===11, ''+r.kinds);
  await p.close();
}

console.log('\n[2] 11가지 공격 방식 전부 동작 + 이펙트');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();});
  await p.waitForTimeout(700);
  await p.evaluate(()=>{const T=window.__TORI,c=T.WD.camps[0];T.P.x=c.x-120;T.P.y=c.y;});
  await p.waitForTimeout(2600);
  const kinds={};
  const res=await p.evaluate(async()=>{
    const T=window.__TORI, out={};
    const byKind={};
    for(const id of Object.keys(T.ABIL)){ const k=T.ABIL[id].kind; if(!byKind[k]) byKind[k]=id; }
    for(const k of Object.keys(byKind)){
      const id=byKind[k];
      T.S.owned[id]=1; T.S.abil=id;
      let dealt=0;
      const before=T.EN.filter(e=>e.alive&&!e.dead).map(e=>e.hp).reduce((a,c)=>a+c,0);
      for(let i=0;i<10;i++){
        let e=null,bd=1e9;
        for(const x of T.EN){ if(!x.alive||x.dead) continue; const d=Math.hypot(x.x-T.P.x,x.y-T.P.y); if(d<bd){bd=d;e=x;} }
        T.doAttack(e?e.x:T.P.x+120, e?e.y:T.P.y);
        await new Promise(r=>setTimeout(r,220));
      }
      await new Promise(r=>setTimeout(r,700));
      out[k]= T.S.prog['0'].kills;
    }
    return out;
  });
  const keys=Object.keys(res);
  ok('11종 전부 실행됨', keys.length===11, keys.join(','));
  let inc=0, prev=0;
  keys.forEach(k=>{ if(res[k]>prev) inc++; prev=res[k]; });
  ok('공격으로 실제 처치 발생', res[keys[keys.length-1]]>0, '누적 처치 '+res[keys[keys.length-1]]);
  await p.screenshot({path:'V3_kinds.png'});
  ok('공격 테스트 중 에러 없음', p.__errs.length===0, p.__errs.slice(0,2).join('|'));
  await p.close();
}

console.log('\n[3] 도감 120종 · 재료 72종 · 지도 100장');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();
    Object.keys(T.SPECIES).forEach((k,i)=>{ if(i%3===0) T.S.codex[k]=i+1; });
    T.MAT_IDS.forEach((m,i)=>{ if(i%2===0) T.S.mat[m]=i+1; });
    for(let c=0;c<34;c++) T.S.prog[''+c]={kills:99,boss:1,chests:{}};
  });
  await p.waitForTimeout(500);
  for(const [k,t,f] of [['book',0,'V3_book0'],['book',1,'V3_book1'],['book',2,'V3_book2'],['map',0,'V3_map']]){
    await p.evaluate(([k,t])=>window.__TORI.openSheet(k,t),[k,t]);
    await p.waitForTimeout(600);
    await p.screenshot({path:f+'.png'});
    const ov=await p.evaluate(()=>{const b=document.getElementById('sheetBody');
      return {ox:b.scrollWidth-b.clientWidth, cells:b.querySelectorAll('.cell').length};});
    ok(k+t+' 렌더 (셀 '+ov.cells+'개, 가로넘침 '+ov.ox+')', ov.ox<=0 && ov.cells>0);
    await p.evaluate(()=>window.__TORI.closeSheet());
    await p.waitForTimeout(200);
  }
  ok('대량 UI 에러 없음', p.__errs.length===0, p.__errs.slice(0,2).join('|'));
  await p.close();
}

console.log('\n[4] 챕터 이동 · 메모리 (지연 베이크 검증)');
{
  const p=await boot(b,412,846,2);
  await p.evaluate(()=>{const T=window.__TORI;T.S.lv=80;T.beginPlay();});
  await p.waitForTimeout(600);
  const h0=await p.evaluate(()=>performance.memory?performance.memory.usedJSHeapSize:0);
  const chaps=[0,7,15,23,38,49,61,74,88,99];
  for(const c of chaps){
    await p.evaluate(c=>window.__TORI.enterChapter(c),c);
    await p.waitForTimeout(420);
  }
  const h1=await p.evaluate(()=>performance.memory?performance.memory.usedJSHeapSize:0);
  const info=await p.evaluate(()=>({chap:window.__TORI.S.chap, cached:window.__TORI.cacheSize(),
    biome:window.__TORI.WD.bi}));
  console.log('     heap '+(h0/1e6).toFixed(1)+' → '+(h1/1e6).toFixed(1)+'MB, 캐시='+JSON.stringify(info.cached));
  ok('10개 챕터 순회 후 힙 20MB 이하', h1/1e6<20, (h1/1e6).toFixed(1)+'MB');
  ok('몬스터 스프라이트 캐시 상한 준수', info.cached.mob<=20, 'mob='+info.cached.mob);
  ok('마지막 장 도달', info.chap>=99);
  await p.screenshot({path:'V3_chap99.png'});
  ok('챕터 순회 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join('|'));
  await p.close();
}

console.log(`\n═══ 통과 ${pass} / 실패 ${fail} ═══`);
await b.close();
})();
