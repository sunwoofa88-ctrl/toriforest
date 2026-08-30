/* 멜로디 규칙 검증 : 모티프 조건 · 악절 구조 · 쉼표 · 안정음 마무리 */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:600,height:400},deviceScaleFactor:1});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 const r=await p.evaluate(()=>{
   const T=window.__TORI, out=[];
   const mk = T.dbg.makeMelody;
   if(!mk) return {err:'no hook'};
   for(let s=0;s<8;s++){
     const m = mk(1234+s*77, ['major','minor','dorian','lydian','mixo','harm'][s%6]);
     const notes=m.filter(x=>x>=0), rests=m.filter(x=>x===-1), holds=m.filter(x=>x===-2);
     const uniq=new Set(notes).size;
     let leap=0; for(let i=1;i<m.length;i++) if(m[i]>=0&&m[i-1]>=0&&Math.abs(m[i]-m[i-1])>4) leap++;
     out.push({len:m.length, notes:notes.length, rests:rests.length, holds:holds.length,
               uniq, leapBig:leap, end:m[m.length-2]});
   }
   return {out};
 });
 if(r.err){ console.log(r.err); } else {
   const a=r.out;
   const ok=(n,c)=>console.log((c?'  ✅ ':'  ❌ ')+n);
   console.log('멜로디 8개 표본');
   ok('길이 64스텝(4마디)', a.every(x=>x.len===64));
   ok('음길이 2종 이상(쉼표·이어짐 존재)', a.every(x=>x.rests>0 && x.holds>0));
   ok('음높이 3종 이상', a.every(x=>x.uniq>=3));
   ok('큰 도약(4도 초과) 전체의 10% 이하 — 부를 수 있어야 한다',
      a.every(x=>x.leapBig <= x.notes*0.10));
   ok('악절 끝이 안정음(0·4·7)', a.every(x=>[0,4,7].indexOf(x.end)>=0));
   console.log('  예시:', JSON.stringify(a[0]));
 }
 console.log('오류:', errs.length?errs.slice(0,2):'없음');
 await b.close();
})();
