/* 캐시를 일부러 가득 채운 뒤에도 색이 제대로 나오는지 (예전엔 흰색이 나왔다) */
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:900,height:520},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>window.__TORI.beginPlay());
 await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{
   const T=window.__TORI, D=T.dbg;
   function avg(img){
     const c=document.createElement('canvas'); c.width=img.width;c.height=img.height;
     const g=c.getContext('2d'); g.drawImage(img,0,0);
     const d=g.getImageData(0,0,img.width,img.height).data;
     let r=0,gg=0,bb=0,n=0;
     for(let i=0;i<d.length;i+=4) if(d[i+3]>40){r+=d[i];gg+=d[i+1];bb+=d[i+2];n++;}
     return n? [Math.round(r/n),Math.round(gg/n),Math.round(bb/n)] : null;
   }
   const src=T.SPR.fx.crescent;
   const before={n:D.aqStat().tint, col:avg(D.tintSpr(src,'#2E86FF'))};
   // 캐시를 억지로 가득 채운다 : 서로 다른 색 200가지
   const imgs=[T.SPR.fx.puff,T.SPR.fx.spark,T.SPR.fx.shard,T.SPR.fx.flash,T.SPR.fx.ring];
   for(let i=0;i<220;i++){
     const c='#'+((i*7919)%0xFFFFFF).toString(16).padStart(6,'0');
     D.tintSpr(imgs[i%imgs.length], c);
   }
   const mid={n:D.aqStat().tint};
   // 이제 새로운 색을 요청 → 흰색이 아니라 제 색이 나와야 한다
   const after={n:D.aqStat().tint, col:avg(D.tintSpr(src,'#FF2E86'))};
   const white=avg(src);
   return {before, mid, after, 원본흰색:white};
 });
 console.log('원본(흰색) 평균색 :', r.원본흰색);
 console.log('캐시 여유일 때 파랑:', r.before.col, ' (캐시', r.before.n, ')');
 console.log('캐시 220번 밀어넣은 뒤:', r.mid.n);
 console.log('그 뒤 분홍 요청     :', r.after.col, ' (캐시', r.after.n, ')');
 const c=r.after.col, w=r.원본흰색;
 const same = Math.abs(c[0]-w[0])<12 && Math.abs(c[1]-w[1])<12 && Math.abs(c[2]-w[2])<12;
 console.log(same? '❌ 흰색 그대로 — 색이 안 입혀짐' : '✅ 캐시가 꽉 차도 색이 제대로 입혀진다');
 await b.close();
})();
