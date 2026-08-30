const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:915,height:412},deviceScaleFactor:2.6,isMobile:true,hasTouch:true});
 await p.goto('file:///root/toriforest/dotorisup.html');
 await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});
 await p.evaluate(()=>window.__TORI.beginPlay());
 await p.waitForTimeout(1000);
 const r=await p.evaluate(()=>{
   const out=[];
   document.querySelectorAll('body *').forEach(e=>{
     const b=e.getBoundingClientRect();
     if(b.width<8||b.height<8) return;
     // 화면 아래쪽 40% 안에 있는 것만
     if(b.bottom < innerHeight*0.58) return;
     const cs=getComputedStyle(e);
     if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return;
     out.push({tag:e.tagName.toLowerCase(), id:e.id||'', cls:(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)||'',
       x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height),
       txt:(e.childElementCount===0?(e.textContent||'').trim().slice(0,14):''),
       fs:cs.fontSize});
   });
   return {W:innerWidth,H:innerHeight,out};
 });
 console.log(`화면 ${r.W}×${r.H}`);
 r.out.sort((a,b)=>a.x-b.x).forEach(o=>
   console.log(`  ${String(o.w).padStart(4)}×${String(o.h).padStart(3)} @(${String(o.x).padStart(4)},${String(o.y).padStart(3)})  ${o.tag}${o.id?'#'+o.id:''}${o.cls?'.'+String(o.cls).split(' ').join('.'):''}  ${o.txt?'“'+o.txt+'”':''} ${o.txt?o.fs:''}`));
 await b.close();
})();
