/* 게임 아이콘 : 게임 아트를 512px 로 새로 구워 선명하게 만든다 */
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:900,height:400},deviceScaleFactor:1});
await p.goto('file:///root/toriforest/dotorisup.html');
await p.waitForFunction('window.__TORI&&window.__TORI.ready===true',{timeout:60000});

const imgs = await p.evaluate(()=>{
  const T=window.__TORI, D=T.dbg, SPR=T.SPR;
  const N=512;
  /* 고해상도로 다시 굽는다 (기존 248px 스프라이트를 늘리면 흐려진다) */
  const HERO=D.bake(D.HERO_SPEC, 900, D.HERO_STATES.idle);
  const ACORN=D.bakeMatSprite('acorn', 460);
  const STAR =D.bakeMatSprite('star', 200);

  function cv(){ const c=document.createElement('canvas'); c.width=N; c.height=N; return c; }
  function rr(g,x,y,w,h,r){ g.beginPath();
    g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
    g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function sky(g,a,b2,h1,h2){
    g.save(); rr(g,0,0,N,N,N*0.225); g.clip();
    const s=g.createLinearGradient(0,0,0,N); s.addColorStop(0,a); s.addColorStop(1,b2);
    g.fillStyle=s; g.fillRect(0,0,N,N);
    const gl=g.createRadialGradient(N*0.5,N*0.26,8,N*0.5,N*0.32,N*0.66);
    gl.addColorStop(0,'rgba(255,255,255,.34)'); gl.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gl; g.fillRect(0,0,N,N);
    g.fillStyle=h1; g.beginPath(); g.ellipse(N*0.5,N*1.02,N*0.92,N*0.40,0,0,6.2832); g.fill();
    g.fillStyle=h2; g.beginPath(); g.ellipse(N*0.5,N*1.12,N*0.84,N*0.40,0,0,6.2832); g.fill();
    /* 잔디 반짝임 */
    g.globalAlpha=.10; g.fillStyle='#FFFFFF';
    for(let i=0;i<14;i++){ g.beginPath();
      g.ellipse(N*(0.08+Math.random()*0.84), N*(0.74+Math.random()*0.22),
                N*0.045, N*0.016, 0,0,6.2832); g.fill(); }
    g.globalAlpha=1;
  }
  function frame(g){
    g.restore();
    g.save();
    g.lineWidth=N*0.055; g.strokeStyle='#2C2119';
    rr(g,g.lineWidth/2,g.lineWidth/2,N-g.lineWidth,N-g.lineWidth,N*0.205); g.stroke();
    g.lineWidth=N*0.015; g.strokeStyle='rgba(255,255,255,.38)';
    rr(g,N*0.062,N*0.062,N*0.876,N*0.876,N*0.172); g.stroke();
    g.restore();
  }
  function sh(g,x,y,rx,ry,a){ g.save(); g.globalAlpha=a||0.24; g.fillStyle='#12200D';
    g.beginPath(); g.ellipse(x,y,rx,ry,0,0,6.2832); g.fill(); g.restore(); }
  const out={};

  /* ── A : 주인공 다람쥐 (캐릭터형) ── */
  { const c=cv(), g=c.getContext('2d');
    sky(g,'#A6E7FB','#63C6EA','#5FC24C','#3D9E39');
    sh(g,N*0.50,N*0.862,N*0.275,N*0.066,0.26);
    g.drawImage(HERO, N*0.50-N*0.445, N*0.864-N*0.800, N*0.89, N*0.89);
    frame(g); out.A=c.toDataURL('image/png'); }

  /* ── B : 도토리 심볼 (직접 그린 통통한 도토리) ── */
  { const c=cv(), g=c.getContext('2d');
    sky(g,'#9AE884','#3F9A4E','#4FB040','#2F8A36');
    const CX=N*0.50, CY=N*0.505, R=N*0.212;
    const INK='#2C2119', LW=N*0.034;
    /* 잎 두 장 (모자 뒤로) */
    g.save(); g.translate(CX, CY-R*1.16);
    [-1,1].forEach(sgn=>{
      g.save(); g.scale(sgn,1); g.rotate(-0.34);
      g.beginPath();
      g.moveTo(0,0);
      g.bezierCurveTo(N*0.075,-N*0.115, N*0.225,-N*0.115, N*0.255,-N*0.012);
      g.bezierCurveTo(N*0.205, N*0.052, N*0.070, N*0.048, 0,0);
      g.closePath();
      g.fillStyle='#6FD055'; g.fill();
      g.strokeStyle=INK; g.lineWidth=LW; g.lineJoin='round'; g.stroke();
      g.strokeStyle='rgba(44,33,25,.40)'; g.lineWidth=N*0.011;
      g.beginPath(); g.moveTo(N*0.030,-N*0.004); g.lineTo(N*0.205,-N*0.030); g.stroke();
      g.restore();
    });
    g.restore();
    sh(g,CX,N*0.860,N*0.250,N*0.058,0.26);
    /* 도토리 알맹이 */
    g.beginPath(); g.ellipse(CX, CY+R*0.46, R*0.94, R*1.00, 0, 0, 6.2832);
    const nut=g.createLinearGradient(CX-R,CY,CX+R,CY+R);
    nut.addColorStop(0,'#D9A268'); nut.addColorStop(.5,'#C07D42'); nut.addColorStop(1,'#8E5326');
    g.fillStyle=nut; g.fill(); g.strokeStyle=INK; g.lineWidth=LW; g.stroke();
    /* 알맹이 하이라이트 */
    g.save(); g.globalAlpha=.34; g.fillStyle='#FFF6E4';
    g.beginPath(); g.ellipse(CX-R*0.32, CY+R*0.06, R*0.26, R*0.36, -0.35, 0, 6.2832); g.fill(); g.restore();
    /* 모자 */
    g.save();
    g.beginPath();
    g.moveTo(CX-R*1.02, CY-R*0.06);
    g.quadraticCurveTo(CX, CY-R*1.30, CX+R*1.02, CY-R*0.06);
    g.quadraticCurveTo(CX, CY+R*0.26, CX-R*1.02, CY-R*0.06);
    g.closePath();
    const cap=g.createLinearGradient(0,CY-R*1.2,0,CY+R*0.2);
    cap.addColorStop(0,'#8E6136'); cap.addColorStop(1,'#5E3C1E');
    g.fillStyle=cap; g.fill(); g.strokeStyle=INK; g.lineWidth=LW; g.stroke();
    /* 모자 결 */
    g.save(); g.clip(); g.strokeStyle='rgba(44,33,25,.30)'; g.lineWidth=N*0.014;
    for(let q=-3;q<=3;q++){ g.beginPath();
      g.moveTo(CX+q*R*0.30, CY-R*1.25); g.lineTo(CX+q*R*0.34, CY+R*0.30); g.stroke(); }
    g.restore();
    g.restore();
    /* 꼭지 */
    g.beginPath(); g.moveTo(CX, CY-R*1.10); g.lineTo(CX, CY-R*1.44);
    g.strokeStyle=INK; g.lineWidth=N*0.040; g.lineCap='round'; g.stroke();
    g.globalAlpha=.96;
    g.drawImage(STAR, N*0.105, N*0.145, N*0.145, N*0.145);
    g.drawImage(STAR, N*0.780, N*0.215, N*0.100, N*0.100);
    g.globalAlpha=1;
    frame(g); out.B=c.toDataURL('image/png'); }

  /* ── C : 주인공 + 도토리 뱃지 ── */
  { const c=cv(), g=c.getContext('2d');
    sky(g,'#B8ECFF','#6ECBEF','#57BC46','#358F33');
    sh(g,N*0.470,N*0.868,N*0.265,N*0.064,0.26);
    g.drawImage(HERO, N*0.470-N*0.420, N*0.870-N*0.760, N*0.84, N*0.84);
    /* 오른쪽 아래 원형 도토리 뱃지 */
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
    g.restore();
    g.restore();
    g.globalAlpha=.95; g.drawImage(STAR, N*0.100, N*0.150, N*0.130, N*0.130); g.globalAlpha=1;
    frame(g); out.C=c.toDataURL('image/png'); }
  return out;
});

for(const k in imgs){
  fs.writeFileSync(`/root/toriforest/icon_${k}.png`, Buffer.from(imgs[k].split(',')[1],'base64'));
}
const cmp = await p.evaluate((src)=>{
  const W=1080,H=470;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  g.fillStyle='#EFE7D6'; g.fillRect(0,0,W,H);
  return new Promise(res=>{
    const keys=Object.keys(src); let n=0;
    keys.forEach((k,i)=>{
      const im=new Image();
      im.onload=()=>{
        const x=48+i*332, y=54, S=290;
        g.save(); g.globalAlpha=.18; g.fillStyle='#2C2119';
        g.beginPath(); g.ellipse(x+S/2,y+S+20,S*0.44,15,0,0,6.2832); g.fill(); g.restore();
        g.drawImage(im,x,y,S,S);
        /* 실제 홈화면 크기(작게) 미리보기 */
        g.drawImage(im, x+S/2-38, y+S+44, 76, 76);
        g.fillStyle='#2C2119'; g.font='700 30px sans-serif'; g.textAlign='center';
        g.fillText(k+'안', x+S/2, y+S+152);
        if(++n===keys.length) res(c.toDataURL('image/png'));
      };
      im.src=src[k];
    });
  });
}, imgs);
fs.writeFileSync('/root/toriforest/icon_compare.png', Buffer.from(cmp.split(',')[1],'base64'));
console.log('done');
await b.close();
})();
