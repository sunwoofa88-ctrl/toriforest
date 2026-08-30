const {chromium}=require('playwright'); const fs=require('fs');
const P=[{n:'A9+가로',w:1280,h:800,d:1.5},{n:'폰세로',w:390,h:844,d:2},{n:'A9+세로',w:800,h:1280,d:1.5}];
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 for(const q of P){
  const p=await b.newPage({viewport:{width:q.w,height:q.h},deviceScaleFactor:q.d,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));
  await p.goto('file:///root/toriforest/dotorisup.html');
  await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:120000});
  await p.evaluate(()=>window.__TORI.beginPlay());
  await p.waitForTimeout(1400);
  const r=await p.evaluate(()=>{
    const W=innerWidth,H=innerHeight,bad=[],boxes=[];
    document.querySelectorAll('.plate,.quest,.hud-right,.menu-cluster .mbtn,#btnAtk,#btnUlt,#btnInh,#btnInhale,.skbtn').forEach(e=>{
      const r=e.getBoundingClientRect(); if(r.width<2) return;
      const id=e.id||e.className.toString().slice(0,18);
      if(r.left<-1||r.top<-1||r.right>W+1||r.bottom>H+1) bad.push(id+' '+[r.left|0,r.top|0,r.right|0,r.bottom|0]);
      boxes.push({id,r});
    });
    let ov=[];
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i].r,c=boxes[j].r;
      const w=Math.min(a.right,c.right)-Math.max(a.left,c.left);
      const h=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
      if(w>4&&h>4) ov.push(boxes[i].id+'×'+boxes[j].id);
    }
    let area=0; document.querySelectorAll('.hud,.dock').forEach(e=>{const r=e.getBoundingClientRect(); area+=r.width*r.height;});
    return {bad,ov:ov.slice(0,4),cover:+(area/(W*H)*100).toFixed(1)};
  });
  await p.screenshot({path:'/root/toriforest/hud_'+q.n+'.png'});
  console.log(q.n+' : 밖으로'+r.bad.length+' 겹침'+r.ov.length+' HUD점유'+r.cover+'%  '+(r.bad[0]||'')+' '+(r.ov[0]||'')+' 오류'+errs.length);
  await p.close();
 }
 await b.close();
})();
