/* 저장 데이터 견고성 + 경계값 : 이상한 저장으로 시작해도 죽지 않아야 한다 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const KEY='toriforest_save_v5';
const CASES=[
  ['정상 없음',        null],
  ['빈 문자열',        ''],
  ['깨진 JSON',        '{lv:'],
  ['JSON 이지만 배열', '[1,2,3]'],
  ['null 저장',        'null'],
  ['빈 객체',          '{}'],
  ['필드 전부 없음',    '{"v":5}'],
  ['음수 값',          '{"lv":-5,"acorn":-100,"star":-3,"chap":-1,"xp":-99}'],
  ['말도 안 되는 값',   '{"lv":1e308,"acorn":1e308,"chap":99999,"xp":1e308}'],
  ['NaN 문자열',       '{"lv":"NaN","acorn":"abc","chap":"x"}'],
  ['타입 뒤죽박죽',     '{"lv":{"a":1},"owned":"nope","mats":[],"eq":5,"pets":"x","tier":null}'],
  ['옛 버전(uiScale 없음)','{"lv":10,"chap":5,"acorn":500,"owned":{},"mats":{}}'],
  ['uiScale 이상값',   '{"lv":10,"uiScale":99,"mobLots":-4}'],
  ['거대 문자열',      '{"lv":10,"abil":"'+'x'.repeat(5000)+'"}'],
];
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 let bad=0;
 for(const [nm,val] of CASES){
  const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push(m.text());});
  await p.addInitScript(([k,v])=>{ try{ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} },[KEY,val]);
  let ok=true, st=null;
  try{
    await p.goto(F);
    await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:45000});
    await p.evaluate(()=>window.__TORI.beginPlay());
    await p.waitForTimeout(1400);
    // 실제로 놀 수 있는가
    await p.evaluate(()=>{const T=window.__TORI;
      for(let i=0;i<6;i++)T.spawnEnemy();
      for(let i=0;i<10;i++){let g=null,d=1e9;
        for(const e of T.EN){if(!e.alive||e.dead)continue;const q=Math.hypot(e.x-T.P.x,e.y-T.P.y);if(q<d){d=q;g=e;}}
        if(g)T.doAttack(g.x,g.y);}
      T.openSheet('gear'); T.closeSheet(); T.openSheet('map'); T.closeSheet();
      T.save();
    });
    await p.waitForTimeout(600);
    st=await p.evaluate(()=>{const S=window.__TORI.S, D=window.__TORI.dbg;
      return {lv:S.lv, chap:S.chap, acorn:S.acorn, hp:D.HP, max:D.maxHp(),
              finite:[S.lv,S.chap,S.acorn,D.HP,D.maxHp()].every(v=>typeof v==='number'&&isFinite(v)),
              frames:D.frameCount()};});
    if(!st.finite) ok=false;
    if(!(st.frames>10)) ok=false;
  }catch(e){ ok=false; errs.push('TEST: '+e.message); }
  const pass = ok && errs.length===0;
  if(!pass) bad++;
  console.log(`${pass?'✅':'❌'} ${nm.padEnd(22)} lv=${st?st.lv:'-'} chap=${st?st.chap:'-'} hp=${st?st.hp:'-'}/${st?st.max:'-'} 프레임=${st?st.frames:'-'}${errs.length? '  오류: '+errs.slice(0,2).join(' | ').slice(0,110):''}`);
  await p.close();
 }
 console.log('\n실패 '+bad+'/'+CASES.length);
 await b.close();
})();
