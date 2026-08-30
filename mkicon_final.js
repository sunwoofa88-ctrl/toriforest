/* 최종 아이콘 세트 생성 : C안 (다람쥐 + 도토리 뱃지)
   - 웹/홈화면용 : 둥근 사각형 PNG (192 / 512)
   - 안드로이드 적응형 : 전경(투명) + 배경, 기기가 알아서 모양을 잡는다
   - 구버전 안드로이드 : 사각/원형 런처 아이콘 */
const {chromium}=require('playwright');
const fs=require('fs'), path=require('path');
const OUT='/root/toriforest/icons';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:600,height:600},deviceScaleFactor:1});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});

const files = await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg;
  const HERO =D.bake(D.HERO_SPEC, 1000, D.HERO_STATES.idle);
  const ACORN=D.bakeMatSprite('acorn', 520);
  const STAR =D.bakeMatSprite('star', 240);
  function cv(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h||w; return c; }
  function rr(g,x,y,w,h,r){ g.beginPath();
    g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
    g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

  /* ── 배경 (하늘 + 언덕) ── */
  function paintBg(g,N,bleed){
    const s=g.createLinearGradient(0,0,0,N);
    s.addColorStop(0,'#B8ECFF'); s.addColorStop(1,'#6ECBEF');
    g.fillStyle=s; g.fillRect(-N,-N,N*3,N*3);
    const gl=g.createRadialGradient(N*0.5,N*0.26,8,N*0.5,N*0.32,N*0.68);
    gl.addColorStop(0,'rgba(255,255,255,.34)'); gl.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gl; g.fillRect(-N,-N,N*3,N*3);
    const k=bleed?1.35:1;   /* 적응형 배경은 화면 밖까지 채워야 한다 */
    g.fillStyle='#57BC46';
    g.beginPath(); g.ellipse(N*0.5,N*1.02,N*0.92*k,N*0.40*k,0,0,6.2832); g.fill();
    g.fillStyle='#358F33';
    g.beginPath(); g.ellipse(N*0.5,N*1.12,N*0.84*k,N*0.40*k,0,0,6.2832); g.fill();
    g.save(); g.globalAlpha=.10; g.fillStyle='#FFFFFF';
    const seed=[[.14,.79],[.31,.86],[.52,.77],[.69,.84],[.83,.78],[.24,.91],[.61,.92],[.44,.83],
                [.09,.87],[.76,.90],[.37,.75],[.90,.85],[.19,.83],[.57,.88]];
    seed.forEach(([sx,sy])=>{ g.beginPath();
      g.ellipse(N*sx,N*sy,N*0.045,N*0.016,0,0,6.2832); g.fill(); });
    g.restore();
  }
  /* ── 전경 (주인공 + 도토리 뱃지 + 별) ── */
  function paintFg(g,N,sc,dy){
    sc=sc||1;
    g.save();
    g.translate(N*0.5, N*0.5+(dy||0)*N); g.scale(sc,sc); g.translate(-N*0.5,-N*0.5);
    g.save(); g.globalAlpha=.24; g.fillStyle='#12200D';
    g.beginPath(); g.ellipse(N*0.470,N*0.868,N*0.265,N*0.064,0,0,6.2832); g.fill(); g.restore();
    g.drawImage(HERO, N*0.470-N*0.420, N*0.870-N*0.760, N*0.84, N*0.84);
    const BX=N*0.775, BY=N*0.762, BR=N*0.155;
    g.save();
    g.globalAlpha=.24; g.fillStyle='#12200D';
    g.beginPath(); g.ellipse(BX, BY+BR*0.92, BR*0.86, BR*0.26,0,0,6.2832); g.fill();
    g.globalAlpha=1;
    g.beginPath(); g.arc(BX,BY,BR,0,6.2832);
    const bg2=g.createLinearGradient(BX-BR,BY-BR,BX+BR,BY+BR);
    bg2.addColorStop(0,'#FFF6DF'); bg2.addColorStop(1,'#FFD98A');
    g.fillStyle=bg2; g.fill();
    g.strokeStyle='#2C2119'; g.lineWidth=N*0.030; g.stroke();
    g.save(); g.beginPath(); g.arc(BX,BY,BR-N*0.014,0,6.2832); g.clip();
    g.drawImage(ACORN, BX-BR*0.86, BY-BR*0.90, BR*1.72, BR*1.72);
    g.restore(); g.restore();
    g.globalAlpha=.95; g.drawImage(STAR, N*0.100, N*0.150, N*0.130, N*0.130); g.globalAlpha=1;
    g.restore();
  }
  function border(g,N,mode){
    g.save();
    g.lineWidth=N*0.055; g.strokeStyle='#2C2119';
    if(mode==='circle'){ g.beginPath(); g.arc(N/2,N/2,N/2-g.lineWidth/2,0,6.2832); g.stroke();
      g.lineWidth=N*0.015; g.strokeStyle='rgba(255,255,255,.38)';
      g.beginPath(); g.arc(N/2,N/2,N*0.438,0,6.2832); g.stroke();
    } else {
      rr(g,g.lineWidth/2,g.lineWidth/2,N-g.lineWidth,N-g.lineWidth,N*0.205); g.stroke();
      g.lineWidth=N*0.015; g.strokeStyle='rgba(255,255,255,.38)';
      rr(g,N*0.062,N*0.062,N*0.876,N*0.876,N*0.172); g.stroke();
    }
    g.restore();
  }
  /* 완성형(테두리 포함) : 웹·구버전 런처용 */
  function full(N, mode){
    const c=cv(N), g=c.getContext('2d');
    g.save();
    if(mode==='circle'){ g.beginPath(); g.arc(N/2,N/2,N/2,0,6.2832); g.clip(); }
    else rr(g,0,0,N,N,N*0.225), g.clip();
    paintBg(g,N,false); paintFg(g,N,1);
    g.restore();
    border(g,N,mode);
    return c.toDataURL('image/png');
  }
  /* 적응형 : 배경만 / 전경만(투명, 안전영역 안으로) */
  function adaptiveBg(N){ const c=cv(N), g=c.getContext('2d'); paintBg(g,N,true); return c.toDataURL('image/png'); }
  function adaptiveFg(N){ const c=cv(N), g=c.getContext('2d');
    /* 108dp 중 가운데 66dp 만 항상 보인다 → 줄이고 살짝 올려 안전영역 한가운데 둔다 */
    paintFg(g,N,0.57,-0.035); return c.toDataURL('image/png'); }

  /* 테마 아이콘(모노크롬) : 안드로이드가 한 가지 색으로 칠하므로 '실루엣'이어야 한다 */
  function mono(N){
    const c=cv(N), g=c.getContext('2d');
    const CX=N*0.5, CY=N*0.50, R=N*0.150;   /* 안전영역(66%) 안쪽 */
    g.fillStyle='#000000';
    /* 잎 두 장 */
    g.save(); g.translate(CX, CY-R*1.18);
    [-1,1].forEach(sg=>{ g.save(); g.scale(sg,1); g.rotate(-0.34);
      g.beginPath(); g.moveTo(0,0);
      g.bezierCurveTo(N*0.052,-N*0.080, N*0.156,-N*0.080, N*0.177,-N*0.008);
      g.bezierCurveTo(N*0.142, N*0.036, N*0.049, N*0.033, 0,0);
      g.closePath(); g.fill(); g.restore(); });
    g.restore();
    /* 꼭지 */
    g.save(); g.lineCap='round'; g.strokeStyle='#000'; g.lineWidth=N*0.030;
    g.beginPath(); g.moveTo(CX, CY-R*1.10); g.lineTo(CX, CY-R*1.48); g.stroke(); g.restore();
    /* 알맹이 */
    g.beginPath(); g.ellipse(CX, CY+R*0.46, R*0.94, R*1.00, 0,0,6.2832); g.fill();
    /* 모자 */
    g.beginPath();
    g.moveTo(CX-R*1.06, CY-R*0.06);
    g.quadraticCurveTo(CX, CY-R*1.32, CX+R*1.06, CY-R*0.06);
    g.quadraticCurveTo(CX, CY+R*0.28, CX-R*1.06, CY-R*0.06);
    g.closePath(); g.fill();
    return c.toDataURL('image/png');
  }
  const out={};
  out['web_192.png']=full(192,'round');
  out['web_512.png']=full(512,'round');
  out['preview_1024.png']=full(1024,'round');
  /* 구버전 런처 (사각 = 기기가 마스킹, 원형 = round) */
  [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]].forEach(([d,n])=>{
    out['legacy_'+d+'_ic_launcher.png']=full(n,'round');
    out['legacy_'+d+'_ic_launcher_round.png']=full(n,'circle');
  });
  /* 적응형 (108dp 기준) */
  [['mdpi',108],['hdpi',162],['xhdpi',216],['xxhdpi',324],['xxxhdpi',432]].forEach(([d,n])=>{
    out['adaptive_'+d+'_fg.png']=adaptiveFg(n);
    out['adaptive_'+d+'_bg.png']=adaptiveBg(n);
    out['adaptive_'+d+'_mono.png']=mono(n);
  });
  /* 플레이스토어 등록용 512 (테두리 없는 꽉 찬 버전) */
  { const c=cv(512), g=c.getContext('2d'); paintBg(g,512,false); paintFg(g,512,1);
    out['store_512.png']=c.toDataURL('image/png'); }
  return out;
});

let total=0;
for(const k in files){
  const buf=Buffer.from(files[k].split(',')[1],'base64');
  fs.writeFileSync(path.join(OUT,k), buf); total+=buf.length;
  }
console.log(Object.keys(files).length+' files, '+(total/1024).toFixed(0)+'KB');
await b.close();
})();
