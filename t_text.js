/* 글자 1.25배 후 : 잘림 · 넘침 · 겹침 검사
   대상 : 모든 시트(가방·장비·펫·만들기·도감·지도)를 3기종에서 연다 */
const {chromium}=require('playwright');
const DEV=[['A9+가로',1340,800],['A9+세로',800,1340],['폰세로',390,844]];
const SHEETS=['bag','gear','pet','forge','book','map'];
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 let bad=0, errs=[];
 for(const [dn,w,h] of DEV){
   const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
   p.on('pageerror',e=>errs.push(dn+': '+String(e).slice(0,90)));
   await p.goto('file:///root/toriforest/dotorisup.html');
   await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
   await p.evaluate(()=>{const T=window.__TORI;T.S.lv=60;T.beginPlay();
     for(const k in T.SPECIES) T.S.codex[k]=1;
     for(const id of T.EQ_IDS) T.giveEquip(id);
     for(const id of T.PET_IDS) T.S.pets[id]=1;
     for(const m of T.MAT_IDS) T.S.mat[m]=20;
     T.rebuildPets&&T.rebuildPets();});
   await p.waitForTimeout(600);
   let dbad=0, notes=[];
   for(const sh of SHEETS){
     await p.evaluate(s=>window.__TORI.openSheet(s), sh);
     await p.waitForTimeout(450);
     const r=await p.evaluate(()=>{
       const body=document.querySelector('.sheet-bd'); if(!body) return {n:0,clip:0,over:0,ov:0};
       const br=body.getBoundingClientRect();
       let clip=0, over=0, ov=0, n=0; const boxes=[];
       const all=body.querySelectorAll('*');
       for(const e of all){
         const cs=getComputedStyle(e);
         if(cs.display==='none'||cs.visibility==='hidden'||!e.offsetParent) continue;
         const t=(e.textContent||'').trim();
         const leaf=!e.children.length;
         const rc=e.getBoundingClientRect();
         if(rc.width<2||rc.height<2) continue;
         if(leaf&&t){
           n++;
           /* 잘림 : 넘치는데 overflow 가 숨김이거나 부모 밖으로 나간 경우 */
           const oX=cs.overflowX, oY=cs.overflowY;
           if(e.scrollWidth>e.clientWidth+2 && (oX==='hidden'||oX==='clip')) { clip++; }
           if(e.scrollHeight>e.clientHeight+2 && (oY==='hidden'||oY==='clip')) { clip++; }
           /* 시트 밖으로 나감 (가로) */
           if(rc.right>br.right+2 || rc.left<br.left-2) over++;
           boxes.push([rc.left,rc.top,rc.right,rc.bottom,e.className]);
         }
       }
       /* 형제 겹침 : 같은 부모의 인접 텍스트 박스끼리 */
       for(let i=0;i<boxes.length;i++) for(let j=i+1;j<Math.min(boxes.length,i+6);j++){
         const A=boxes[i],B=boxes[j];
         const ox=Math.min(A[2],B[2])-Math.max(A[0],B[0]);
         const oy=Math.min(A[3],B[3])-Math.max(A[1],B[1]);
         if(ox>4&&oy>4) ov++;
       }
       return {n,clip,over,ov};
     });
     if(r.clip||r.over||r.ov){ dbad++; notes.push(sh+'(잘림'+r.clip+' 넘침'+r.over+' 겹침'+r.ov+')'); }
     await p.evaluate(()=>window.__TORI.closeSheet());
     await p.waitForTimeout(160);
   }
   console.log('  '+dn.padEnd(9)+(dbad? '❌ '+notes.join(' '):'✅ 잘림0 넘침0 겹침0'));
   bad+=dbad;
   await p.close();
 }
 console.log(bad? '  ❌ 문제 '+bad+'건':'  ✅ 6개 시트 × 3기종 전부 정상');
 console.log('오류:', errs.length?errs.slice(0,3):'없음');
 await b.close();
 process.exit(bad?1:0);
})();
