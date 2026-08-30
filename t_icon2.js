const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:600,height:600},deviceScaleFactor:1});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
const sizes=[48,72,96,144,192,512];
for(const S of sizes){
  const d=await p.evaluate((S)=>{
    const T=window.__TORI;
    const c=document.createElement('canvas'); c.width=S; c.height=S;
    const g=c.getContext('2d'); const k=S/192;
    const bg2=g.createLinearGradient(0,0,S,S);
    bg2.addColorStop(0,'#9BE885'); bg2.addColorStop(.5,'#5CB65A'); bg2.addColorStop(1,'#25683C');
    g.fillStyle=bg2; g.fillRect(0,0,S,S);
    let seed=12345; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff;};
    for(let i=0;i<30;i++){ g.beginPath();
      g.ellipse(rnd()*S,rnd()*S,(8+rnd()*26)*k,(5+rnd()*15)*k,0,0,6.2832);
      g.fillStyle='rgba(255,255,255,.07)'; g.fill(); }
    g.beginPath(); g.ellipse(S*0.5,S*0.80,S*0.34,S*0.10,0,0,6.2832);
    g.fillStyle='rgba(0,0,0,.18)'; g.fill();
    const a=T.SPR.fx.acorn;
    const sz=S*0.70;
    g.drawImage(a, S*0.5-sz/2, S*0.5-sz/2-S*0.03, sz, sz);
    return c.toDataURL('image/png');
  },S);
  fs.writeFileSync('/root/toriforest/andproj/icon_'+S+'.png', Buffer.from(d.split(',')[1],'base64'));
}
console.log('아이콘 '+sizes.length+'종 생성');
await b.close();})();
