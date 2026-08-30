const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--no-sandbox']});
 const p=await b.newPage({viewport:{width:1024,height:576},deviceScaleFactor:1});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>window.__TORI.beginPlay());
 await p.waitForTimeout(1600);
 const r=await p.evaluate(()=>{
   const T=window.__TORI, D=T.dbg;
   // 주인공 바로 옆에 몬스터 3마리
   for(const e of T.EN) e.alive=false;
   D.setRoam(0);
   const made=[];
   for(let i=0;i<3;i++){
     const e=T.spawnEnemy();
     if(e){ e.x=T.P.x+90+i*40; e.y=T.P.y+10; made.push({x:Math.round(e.x),y:Math.round(e.y),key:e.key}); }
   }
   const alive=T.EN.filter(e=>e.alive&&!e.dead).map(e=>({x:Math.round(e.x),y:Math.round(e.y),
     d:Math.round(Math.hypot(e.x-T.P.x,e.y-T.P.y))}));
   const t=D.objTarget? D.objTarget() : null;
   const pg=D.prog();
   return { P:{x:Math.round(T.P.x),y:Math.round(T.P.y)}, made, alive,
     target: t? {x:Math.round(t.x),y:Math.round(t.y),label:t.label,near:!!t.near,
                 d:Math.round(Math.hypot(t.x-T.P.x,t.y-T.P.y))} : null,
     kills:pg.kills, need:D.chapKillNeed(T.S.chap), boss:!!pg.boss,
     camps:T.WD.camps.map(c=>Math.round(Math.hypot(c.x-T.P.x,c.y-T.P.y))) };
 });
 console.log(JSON.stringify(r,null,1));
 await b.close();
})();
