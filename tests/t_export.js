/* 실제 게임 엔진에서 진짜 스프라이트를 뽑는다 (손으로 그리지 않는다) */
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:90000});
 await p.evaluate(()=>{const T=window.__TORI;T.S.lv=40;T.beginPlay();});
 await p.waitForTimeout(2500);

 const out=await p.evaluate(async()=>{
   const T=window.__TORI, D=T.dbg;
   const res={};
   function toPng(cv, pad){
     if(!cv) return null;
     const c=document.createElement('canvas');
     c.width=cv.width; c.height=cv.height;
     const g=c.getContext('2d'); g.drawImage(cv,0,0);
     return c.toDataURL('image/png');
   }
   /* ① 몬스터 : 1장 바이옴에서 여러 종 */
   res.mobs={};
   const keys=Object.keys(D.SPECIES);
   const pick=[];
   for(let bi=0; bi<4; bi++){
     const ms=D.chapMobs(bi*10);
     for(const k of ms) if(pick.indexOf(k)<0 && pick.length<14) pick.push(k);
   }
   for(const k of pick){
     const mc=T.dbg.ensureMob? T.dbg.ensureMob(k) : null;
     if(mc&&mc.n) res.mobs[k]={img:toPng(mc.n), name:D.SPECIES[k].n||k};
   }
   /* ② 주인공 */
   res.hero={};
   for(const st of ['idle','atk','inhale']) if(T.SPR.hero[st]) res.hero[st]=toPng(T.SPR.hero[st]);
   /* ③ 펫 */
   res.pets={};
   let n=0;
   for(const id of T.PET_IDS){ if(n>=8) break;
     const P=T.PETS[id]; if(!P) continue;
     const s=T.dbg.petSpr? T.dbg.petSpr(id) : null;
     if(s){ res.pets[id]={img:toPng(s), name:P.n, grade:P.grade}; n++; }
   }
   /* ④ 장비 */
   res.eq={};
   let m=0;
   for(const id of T.EQ_IDS){ if(m>=6) break;
     const E=T.EQUIP[id]; if(!E||E.grade<3) continue;
     const s=T.eqSpr(id);
     if(s){ res.eq[id]={img:toPng(s), name:E.n, grade:E.grade}; m++; }
   }
   /* ⑤ 소품 */
   res.props={};
   for(const k of ['tree','rock','flower','mushroom','fence','lamp','chest','house','well','sign','gate','bush']){
     const arr=T.SPR.prop&&T.SPR.prop[k];
     if(arr&&arr[0]) res.props[k]=toPng(arr[0]);
   }
   /* ⑥ 지형 : 월드 그라운드에서 잘라낸다 */
   if(T.WD&&T.WD.ground){
     const gw=T.WD.ground.width, gh=T.WD.ground.height;
     const c=document.createElement('canvas'); c.width=900; c.height=560;
     const g=c.getContext('2d');
     g.drawImage(T.WD.ground, Math.min(gw-900, 400), Math.min(gh-560, 400), 900,560, 0,0, 900,560);
     res.ground=c.toDataURL('image/png');
   }
   return res;
 });

 const dir='/root/concept/art';
 let cnt=0;
 function save(name, dataurl){
   if(!dataurl) return;
   fs.writeFileSync(dir+'/'+name, Buffer.from(dataurl.split(',')[1],'base64'));
   cnt++;
 }
 for(const k in out.mobs) save('mob_'+k+'.png', out.mobs[k].img);
 for(const k in out.hero) save('hero_'+k+'.png', out.hero[k]);
 for(const k in out.pets) save('pet_'+k+'.png', out.pets[k].img);
 for(const k in out.eq)   save('eq_'+k+'.png',  out.eq[k].img);
 for(const k in out.props)save('prop_'+k+'.png',out.props[k]);
 save('ground.png', out.ground);
 fs.writeFileSync(dir+'/meta.json', JSON.stringify({
   mobs:Object.fromEntries(Object.entries(out.mobs).map(([k,v])=>[k,v.name])),
   pets:Object.fromEntries(Object.entries(out.pets).map(([k,v])=>[k,{n:v.name,g:v.grade}])),
   eq:Object.fromEntries(Object.entries(out.eq).map(([k,v])=>[k,{n:v.name,g:v.grade}]))
 },null,1));
 console.log('저장 '+cnt+'개');
 console.log('몬스터:', Object.keys(out.mobs).length, ' 주인공:', Object.keys(out.hero).length,
             ' 펫:', Object.keys(out.pets).length, ' 장비:', Object.keys(out.eq).length,
             ' 소품:', Object.keys(out.props).length, ' 지형:', out.ground?'있음':'없음');
 await b.close();
})();
