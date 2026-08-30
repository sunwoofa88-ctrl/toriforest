const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1200,height:900},deviceScaleFactor:2});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
// 몬스터 시트
const mob=await p.evaluate(()=>{
  const T=__TORI, D=T.dbg, S=T.S;
  const ks=Object.keys(D.SPECIES);
  const pick=[]; for(let i=0;i<ks.length;i+=Math.floor(ks.length/24)) pick.push(ks[i]);
  const N=pick.length, COL=8, ROW=Math.ceil(N/COL), CELL=170;
  const c=document.createElement('canvas'); c.width=COL*CELL; c.height=ROW*CELL+30;
  const g=c.getContext('2d'); g.fillStyle='#2A3B22'; g.fillRect(0,0,c.width,c.height);
  pick.forEach((k,i)=>{ const s=D.bake?null:null;
    const mc=D.ensureMob? D.ensureMob(k):null;
    const img=mc?mc.n:null; if(!img) return;
    const x=(i%COL)*CELL, y=Math.floor(i/COL)*CELL;
    g.drawImage(img, x+6,y+6, CELL-12, CELL-12);
    g.font='700 13px sans-serif'; g.fillStyle='#fff'; g.textAlign='center';
    g.fillText(D.SPECIES[k].n, x+CELL/2, y+CELL-4);
  });
  return c.toDataURL('image/png');
});
require('fs').writeFileSync('/root/toriforest/SHEET_mob.png', Buffer.from(mob.split(',')[1],'base64'));
// 무기/방어구 시트
const eq=await p.evaluate(()=>{
  const T=__TORI, D=T.dbg;
  const ids=T.EQ_IDS||Object.keys(T.EQUIP);
  const pick=[]; for(let i=0;i<ids.length;i+=Math.max(1,Math.floor(ids.length/24))) pick.push(ids[i]);
  const N=pick.length, COL=8, ROW=Math.ceil(N/COL), CELL=170;
  const c=document.createElement('canvas'); c.width=COL*CELL; c.height=ROW*CELL+30;
  const g=c.getContext('2d'); g.fillStyle='#241C2E'; g.fillRect(0,0,c.width,c.height);
  pick.forEach((k,i)=>{ const img=T.eqSpr? T.eqSpr(k,160,3):null; if(!img) return;
    const x=(i%COL)*CELL, y=Math.floor(i/COL)*CELL;
    g.drawImage(img, x+5,y+5,CELL-10,CELL-10);
    g.font='700 12px sans-serif'; g.fillStyle='#fff'; g.textAlign='center';
    g.fillText(T.EQUIP[k].n.slice(0,12), x+CELL/2, y+CELL-3);
  });
  return c.toDataURL('image/png');
});
require('fs').writeFileSync('/root/toriforest/SHEET_eq.png', Buffer.from(eq.split(',')[1],'base64'));
console.log('ok');
await b.close();})();
