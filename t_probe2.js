/* 밸런스 : 장별 난이도 곡선에 급격한 벽이나 지루한 구간이 있는지 */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1356,height:848}});
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
  const r=await p.evaluate(()=>{
    const T=window.__TORI, rows=[];
    for(let ch=1; ch<=110; ch++){
      let mobs=[]; try{ mobs=T.chapMobs(ch)||[]; }catch(e){}
      let hp=0, atk=0, n=0;
      for(const m of mobs){ const id=(typeof m==='string')?m:(m&&m.id); const sp=T.SPECIES[id];
        if(!sp) continue; hp+=(sp.hp||0); atk+=(sp.atk||0); n++; }
      let boss=null; try{ boss=T.chapBoss(ch); }catch(e){}
      const bsp=boss&&T.SPECIES[boss.id||boss];
      rows.push({ch, 몹종:n, 평균체력:n?Math.round(hp/n):0, 평균공격:n?Math.round(atk/n):0,
                 보스체력:bsp?bsp.hp:0});
    }
    return rows;
  });
  console.log('장  몹종  평균체력  평균공격  보스체력   전장대비 체력증가율');
  let prev=0, jumps=[];
  for(const q of r){
    if(q.ch%10===1 || q.ch<=5 || q.ch>=108){
      const g=prev? ((q.평균체력/prev-1)*100).toFixed(0)+'%' : '-';
      console.log(String(q.ch).padStart(3), String(q.몹종).padStart(4), String(q.평균체력).padStart(8),
                  String(q.평균공격).padStart(8), String(q.보스체력).padStart(8), '   '+g);
    }
    if(prev && q.평균체력 > prev*1.9) jumps.push({ch:q.ch, from:prev, to:q.평균체력});
    prev=q.평균체력;
  }
  console.log('\n체력이 한 장 만에 1.9배 넘게 뛰는 구간(난이도 벽):', jumps.length);
  for(const j of jumps.slice(0,8)) console.log('   '+j.ch+'장: '+j.from+' → '+j.to);
  await b.close();
})();
