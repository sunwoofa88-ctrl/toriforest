/* 폰 가로에서 우측 하단 버튼 실측 : 크기 · 화면 점유 · 글자 겹침 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
const CASES=[
  ['갤S22+ 가로',      915,412,2.6],
  ['갤A9+ 가로',      1280,800,1.5],
  ['일반폰 가로',      844,390,3.0],
  ['작은폰 가로',      740,360,3.0],
  ['갤폴드 커버 가로',  816,373,2.6],
];
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 for(const [nm,w,h,d] of CASES){
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:d,isMobile:true,hasTouch:true});
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{
    const R=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,r:b.right,bo:b.bottom};};
    const out={W:innerWidth,H:innerHeight,u:getComputedStyle(document.documentElement).getPropertyValue('--u').trim()};
    const q=s=>document.querySelector(s);
    const map={atk:'#btnAtk',ult:'#btnUlt',inh:'#btnInhale'};
    out.btn={};
    for(const k in map){ const e=q(map[k]); if(e) out.btn[k]=R(e); }
    // 스킬바와 그 글자
    const sb=q('.skill-cluster'); if(sb) out.skillBar=R(sb);
    out.labels=[];
    document.querySelectorAll('b.skill-cap').forEach(e=>out.labels.push({t:e.textContent.trim(),...R(e)}));
    // 하단 버튼 전체가 차지하는 넓이
    let area=0; for(const k in out.btn){ area+=out.btn[k].w*out.btn[k].h; }
    out.btnAreaPct=+(100*area/(innerWidth*innerHeight)).toFixed(1);
    // 겹침 검사 : 공격/필살기/삼키기 원이 스킬 글자를 덮는가
    out.overlap=[];
    const circles=Object.entries(out.btn);
    for(const L of out.labels){
      for(const [k,c] of circles){
        const ox=Math.max(0,Math.min(L.r,c.r)-Math.max(L.x,c.x));
        const oy=Math.max(0,Math.min(L.bo,c.bo)-Math.max(L.y,c.y));
        if(ox>1&&oy>1) out.overlap.push({label:L.t,by:k,px:Math.round(ox*oy)});
      }
    }
    // 화면 밖으로 나간 글자
    out.clipped=out.labels.filter(L=>L.bo>innerHeight+0.5||L.r>innerWidth+0.5).map(L=>L.t);
    // 화면 아래 끝에서 얼마나 떨어져 있는가 (안드로이드 제스처바 구간)
    out.bottomGap=Math.round(Math.min.apply(null,out.labels.map(L=>innerHeight-L.bo)));
    out.minFont=Math.min.apply(null,out.labels.map(L=>parseFloat(getComputedStyle(document.querySelector('b.skill-cap')).fontSize)));
    out.fonts=[...new Set([...document.querySelectorAll('b.skill-cap')].map(e=>getComputedStyle(e).fontSize))];
    // 진짜 '잘림' 검사 : 내용 너비가 보이는 너비보다 크면 잘린 것
    out.trunc=[...document.querySelectorAll('b.skill-cap')]
      .filter(e=>e.scrollWidth>e.clientWidth+1)
      .map(e=>e.textContent.trim()+'('+e.scrollWidth+'>'+e.clientWidth+')');
    return out;
  });
  const bs=Object.entries(r.btn).map(([k,v])=>`${k} ${Math.round(v.w)}px`).join(' ');
  console.log(`\n■ ${nm}  ${r.W}×${r.H}  --u=${r.u}`);
  console.log(`   버튼: ${bs}   하단버튼 점유 ${r.btnAreaPct}%`);
  console.log(`   글자 ${r.labels.length}개  글꼴 ${r.fonts.join('/')}  아래끝 여백 ${r.bottomGap}px  겹침 ${r.overlap.length}  화면밖 ${r.clipped.length}  글자잘림 ${r.trunc.length?r.trunc.join(','):'없음'}`);
  if(r.overlap.length) console.log('   ⚠ 겹침: '+r.overlap.map(o=>`"${o.label}"←${o.by}`).join(', '));
  if(r.clipped.length) console.log('   ⚠ 잘림: '+r.clipped.join(', '));
  await p.close();
 }
 await b.close();
})();
