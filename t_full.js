const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:412,height:846},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message+'\n'+(e.stack||'').split('\n').slice(1,3).join('\n')));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::/.test(m.text()))errs.push('C:'+m.text());});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(600);
  // 강하게 만들어 진행 가속
  await p.evaluate(()=>{ const S=window.__TORI.S; S.lv=60; });
  const marks=[];
  let lastZone=0, absorbed=0, bossSeen=0;
  for(let t=0;t<1400;t++){
    const st=await p.evaluate(()=>{
      const T=window.__TORI, S=T.S, P=T.P;
      let e=null, low=null, boss=false;
      for(const x of T.EN){ if(x.alive&&!x.dead){ if(!e)e=x; if(x.boss)boss=true; if(!x.boss&&x.hp<=x.hpMax*0.36&&!low)low=x; } }
      if(low){ P.inhale=true; P.facing = low.x>=P.x?1:-1; }
      else { P.inhale=false; if(e) T.doAttack(e.x,e.y-e.size*0.5); }
      return {z:S.zone,s:S.stage,lv:S.lv,owned:Object.keys(S.owned).length,cards:JSON.stringify(S.cards),boss:boss,state:T.G.state,hp:0};
    });
    if(st.boss) bossSeen=1;
    if(st.z!==lastZone){ marks.push('ZONE '+lastZone+' → '+st.z+' @tick'+t); lastZone=st.z; }
    if(st.z===3&&st.s>=2) break;
    await p.waitForTimeout(50);
  }
  const fin=await p.evaluate(()=>{const S=window.__TORI.S;return{zone:S.zone,stage:S.stage,lv:S.lv,owned:S.owned,cards:S.cards,pets:S.pets,mat:S.mat,acorn:S.acorn,star:S.star,codex:Object.keys(S.codex).length};});
  console.log('진행:', marks.join(' | ')||'(zone 변화 없음)');
  console.log('보스 등장:', bossSeen?'YES':'NO');
  console.log('최종:', JSON.stringify(fin,null,0));
  await p.screenshot({path:'f_final.png'});
  // 저장/불러오기 검증
  await p.evaluate(()=>{ try{ localStorage.removeItem('X'); }catch(e){} });
  const saved=await p.evaluate(()=>{ try{ return !!localStorage.getItem('toriforest_save_v3'); }catch(e){ return 'blocked'; } });
  console.log('저장 동작:', saved);
  await p.reload();
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const reloaded=await p.evaluate(()=>{const S=window.__TORI.S;return{zone:S.zone,stage:S.stage,lv:S.lv,owned:Object.keys(S.owned).length};});
  console.log('재시작 후 복원:', JSON.stringify(reloaded));
  console.log(errs.length?'\nERRORS:\n'+errs.join('\n'):'\nNO ERRORS');
  await b.close();
})();
