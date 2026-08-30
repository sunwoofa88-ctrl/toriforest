/* 게임 안의 모든 그림이 '최신본'으로 실제 적용됐는지 전수 확인.
   ① art/ 에 있는데 게임이 안 쓰는 그림  ② 게임이 찾는데 art/ 에 없는 그림
   ③ 디코딩 실패·0바이트·빈 그림  ④ 아이콘류(스킬·재료·장비·펫)가 절차적 대체본으로 떨어진 것 */
const {chromium}=require('playwright');
const fs=require('fs');
const F='file:///root/toriforest/dotorisup.html';
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1340,height:800},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F);
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1200);

  const r=await p.evaluate(()=>{
    const T=window.__TORI;
    const SRC = window.ART_SRC || T.ART_SRC || (T.dbg&&T.dbg.ART_SRC) || null;
    const out={keys:[], broken:[], empty:[], hasSrc:!!SRC};
    if(SRC){
      for(const k in SRC){
        out.keys.push(k);
        const im = T.artOf? T.artOf(k) : null;
        if(!im){ out.broken.push(k); continue; }
        if(!im.width || !im.height){ out.broken.push(k); continue; }
        /* 빈 그림(전부 투명) 검사 */
        try{
          const c=document.createElement('canvas');
          const S=Math.min(64,im.width); c.width=S; c.height=S;
          const g=c.getContext('2d'); g.drawImage(im,0,0,S,S);
          const d=g.getImageData(0,0,S,S).data;
          let a=0; for(let i=3;i<d.length;i+=4) a+=d[i];
          if(a/255/(S*S) < 0.005) out.empty.push(k);
        }catch(e){ out.broken.push(k+'(read:'+e.message+')'); }
      }
    }
    return out;
  });
  fs.writeFileSync('/tmp/art_used.txt', r.keys.slice().sort().join('\n')+'\n');
  console.log('ART_SRC 노출:', r.hasSrc, ' 그림 키:', r.keys.length);
  console.log('디코딩 실패:', r.broken.length, r.broken.slice(0,8));
  console.log('내용이 빈 그림:', r.empty.length, r.empty.slice(0,8));
  console.log('페이지 오류:', errs.length, errs.slice(0,3));
  await b.close();
  process.exit((r.broken.length===0&&r.empty.length===0&&errs.length===0&&r.hasSrc)?0:1);
})();
