/* 몬스터 실루엣 다양성 실측 : 32px 로 줄여 형태만 비교한다
   (포켓몬 디자인 원칙 : 작게 줄여도 서로 구별되어야 한다) */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:800,height:600},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
 await p.evaluate(()=>{const T=window.__TORI;T.beginPlay();});
 await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{
   const T=window.__TORI, D=T.dbg;
   const keys=Object.keys(D.SPECIES);
   const N=32;
   const sigs=[];
   const cv=document.createElement('canvas'); cv.width=N; cv.height=N;
   const g=cv.getContext('2d');
   for(const k of keys){
     let mc=null;
     try{ mc=D.ensureMob(k); }catch(e){}
     if(!mc||!mc.n) continue;
     g.clearRect(0,0,N,N);
     g.drawImage(mc.n,0,0,N,N);
     const d=g.getImageData(0,0,N,N).data;
     const bits=new Uint8Array(N*N);
     for(let i=0;i<N*N;i++) bits[i]= d[i*4+3]>90?1:0;
     sigs.push({k,bits,arch:(D.SPECIES[k].art||{}).arch,sig:(D.SPECIES[k].art||{}).sig,w:(D.SPECIES[k].art||{}).w,h:(D.SPECIES[k].art||{}).h});
   }
   /* 서로의 실루엣 차이(해밍 거리) */
   let tot=0, cnt=0, minD=1e9, minPair=null;
   const near=[];
   for(let i=0;i<sigs.length;i++) for(let j=i+1;j<sigs.length;j++){
     let d2=0;
     const a=sigs[i].bits, c2=sigs[j].bits;
     for(let x=0;x<N*N;x++) if(a[x]!==c2[x]) d2++;
     tot+=d2; cnt++;
     if(d2<minD){ minD=d2; minPair=[sigs[i].k,sigs[j].k]; }
     if(d2 < N*N*0.06) near.push([sigs[i].k,sigs[j].k,+(d2/(N*N)*100).toFixed(1)]);
   }
   /* 채우는 면적(몸집)이 얼마나 다양한가 */
   const area=sigs.map(s=>{let n2=0; for(const v of s.bits) n2+=v; return n2/(N*N);});
   area.sort((a,b)=>a-b);
   return { n:sigs.length, avgDiff:+(tot/cnt/(N*N)*100).toFixed(1),
     minDiff:+(minD/(N*N)*100).toFixed(1), minPair,
     nearlyIdentical: near.length, nearList: near.slice(0,8).map(x=>{const A=sigs.find(z=>z.k===x[0]),B2=sigs.find(z=>z.k===x[1]);return x[0]+'('+A.arch+'/'+A.sig+') vs '+x[1]+'('+B2.arch+'/'+B2.sig+') '+x[2]+'%';}),
     areaMin:+area[0].toFixed(3), areaMed:+area[area.length>>1].toFixed(3), areaMax:+area[area.length-1].toFixed(3) };
 });
 console.log('검사한 몬스터        '+r.n+'종');
 console.log('실루엣 평균 차이     '+r.avgDiff+'%   ← 30% 이상이어야 "확실히 다르다"');
 console.log('가장 비슷한 두 종     '+r.minDiff+'%  ('+r.minPair.join(' vs ')+')');
 console.log('닮은 쌍(6%미만) '+r.nearlyIdentical+'쌍');
 if(r.nearList) r.nearList.forEach(x=>console.log('   '+x));
 console.log('몸집(채움비율)       최소 '+r.areaMin+' / 중앙 '+r.areaMed+' / 최대 '+r.areaMax);
 /* ══ 빌드 게이트 ══
    '좋아졌다'를 말이 아니라 수치로 막는다.
    기준 : 평균 차이 30% 이상 · 5% 미만으로 닮은 쌍 0개
    (재설계 전 실측 = 평균 22.1% · 5%미만 26쌍) */
 const hard = (r.nearList||[]).filter(x=>parseFloat(x.split(' ').pop())<5.0).length;
 const pass = r.avgDiff>=30.0 && hard===0;
 console.log('');
 console.log(pass? '✅ 게이트 통과 (평균 '+r.avgDiff+'% ≥ 30% · 5%미만 쌍 0개)'
                 : '❌ 게이트 실패 (평균 '+r.avgDiff+'% · 5%미만 쌍 '+hard+'개)');
 if(!pass) process.exitCode=1;
 await b.close();
})();
