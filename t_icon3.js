/* 홈 화면 아이콘 · 앱 이름 검증 */
const {chromium}=require('playwright');
const F='file:///root/toriforest/dotorisup.html';
let pass=0, fail=0;
function ok(n,c,d){ if(c){pass++;console.log('  ✅ '+n);} else {fail++;console.log('  ❌ '+n+(d?'  → '+d:''));} }
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:846,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|net::|favicon/.test(m.text()))p.__errs.push(m.text())});
await p.goto(F);

/* ① 게임이 실행되기 '전'에 이미 아이콘이 head 에 있어야 한다
      (홈 화면에 추가할 때 브라우저는 로드 시점의 head 만 본다) */
const preload = await p.evaluate(()=>{
  const q=s=>document.head.querySelector(s);
  const at=q('link[rel="apple-touch-icon"]'), ic=q('link[rel="icon"]');
  return {
    title: document.title,
    appName: (q('meta[name="application-name"]')||{}).content,
    appleTitle: (q('meta[name="apple-mobile-web-app-title"]')||{}).content,
    hasApple: !!at, hasIcon: !!ic,
    appleIsData: at? at.href.slice(0,15) : '',
    appleSizes: at? at.getAttribute('sizes') : '',
    iconSizes: ic? ic.getAttribute('sizes') : '',
    bytes: at? at.href.length : 0
  };
});
ok('제목이 "도토리숲 대모험"', preload.title==='도토리숲 대모험', preload.title);
ok('application-name 이 "도토리숲 대모험"', preload.appName==='도토리숲 대모험', preload.appName);
ok('iOS 홈화면 이름이 "도토리숲 대모험"', preload.appleTitle==='도토리숲 대모험', preload.appleTitle);
ok('게임 실행 전에 이미 apple-touch-icon 이 head 에 있다', preload.hasApple===true);
ok('게임 실행 전에 이미 rel=icon 이 head 에 있다', preload.hasIcon===true);
ok('아이콘이 파일 없이 내장(data URI)되어 있다', preload.appleIsData==='data:image/png;', preload.appleIsData);
ok('아이콘 크기가 192x192 로 선언되어 있다',
   preload.appleSizes==='192x192' && preload.iconSizes==='192x192',
   preload.appleSizes+' / '+preload.iconSizes);
ok('아이콘 용량이 60KB 이하', preload.bytes<60000, Math.round(preload.bytes/1024)+'KB');

/* ② 아이콘이 실제로 디코딩되는 진짜 이미지인지 */
const img = await p.evaluate(()=>new Promise(res=>{
  const at=document.head.querySelector('link[rel="apple-touch-icon"]');
  const im=new Image();
  im.onload=()=>{
    const c=document.createElement('canvas'); c.width=im.width; c.height=im.height;
    const g=c.getContext('2d'); g.drawImage(im,0,0);
    const d=g.getImageData(0,0,c.width,c.height).data;
    let opaque=0, colors={};
    for(let i=0;i<d.length;i+=4){ if(d[i+3]>200){ opaque++;
      colors[(d[i]>>5)+'_'+(d[i+1]>>5)+'_'+(d[i+2]>>5)]=1; } }
    res({w:im.width,h:im.height, opaquePct:Math.round(opaque/(c.width*c.height)*100),
         colorBuckets:Object.keys(colors).length});
  };
  im.onerror=()=>res({err:1});
  im.src=at.href;
}));
ok('아이콘이 실제 192x192 이미지로 열린다', img.w===192 && img.h===192, JSON.stringify(img));
ok('아이콘이 빈 이미지가 아니다(내용이 꽉 차 있다)', img.opaquePct>=88, img.opaquePct+'% 불투명');
ok('아이콘이 단색이 아니다(그림이 들어 있다)', img.colorBuckets>=12, img.colorBuckets+'가지 색');

/* ③ 게임 실행 후 매니페스트도 붙는지 (안드로이드 '앱 설치'용) */
await p.evaluate(()=>window.__TORI.beginPlay());
await p.waitForTimeout(600);
const man = await p.evaluate(async()=>{
  const ml=document.head.querySelector('link[rel="manifest"]');
  if(!ml) return {none:1};
  const j=await (await fetch(ml.href)).json();
  return {name:j.name, short:j.short_name, icons:j.icons.length,
          size:j.icons[0].sizes, purpose:j.icons[0].purpose,
          display:j.display, orient:j.orientation, iconOk:j.icons[0].src.slice(0,15)};
});
ok('매니페스트 name 이 "도토리숲 대모험"', man.name==='도토리숲 대모험', JSON.stringify(man));
ok('매니페스트 짧은 이름도 "도토리숲 대모험"', man.short==='도토리숲 대모험', man.short);
ok('매니페스트 아이콘이 정상 연결', man.iconOk==='data:image/png;' && man.size==='192x192', JSON.stringify(man));
ok('가로 전체화면으로 실행되게 설정', man.display==='fullscreen' && man.orient==='landscape', JSON.stringify(man));

/* ④ 아이콘 태그가 게임 동작을 방해하지 않는지 */
const play = await p.evaluate(async()=>{
  const T=window.__TORI;
  const x0=T.P.x; T.P.vx=1; T.P.vy=0;
  await new Promise(r=>setTimeout(r,500)); T.P.vx=0;
  return {moved:Math.abs(T.P.x-x0)>1, ready:T.ready, chap:T.S.chap};
});
ok('아이콘 추가 후에도 게임이 정상 동작', play.moved===true && play.ready===true, JSON.stringify(play));
ok('아이콘 관련 JS 에러 없음', p.__errs.length===0, p.__errs.slice(0,3).join(' | '));

console.log(`\n===== ${pass} 통과 / ${fail} 실패 =====`);
await b.close();
process.exit(fail?1:0);
})();
