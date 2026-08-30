# -*- coding: utf-8 -*-
"""무기 계열별 '자세' 그림 시트 → hero_pose_*.webp + 자세별 쥐는 자리.

   원리 ④ — 자세는 무기 계열이 고른다. 계열마다 쥐는 자리(좌표·각도)가 따로 있다.
   참고로 받은 상용 스프라이트 시트 13종이 전부 이렇게 돼 있다 :
   궁수 자세 · 도끼 양손 자세 · 지팡이 자세가 각각 다르고, 팔이 전부 몸 밖으로 나가 있다.

   봉이 기울어져 있으므로 각도도 그림에서 잰다(주성분분석). 짐작 없음."""
from PIL import Image
import numpy as np, json, sys, os, math
from collections import deque

BASE_F = 112/120.0
OUT    = 192

def cut(src, keys):
    im=Image.open(src).convert('RGB'); a=np.array(im).astype(int); H,W,_=a.shape
    R,G,B=a[:,:,0],a[:,:,1],a[:,:,2]
    magcore=(R>110)&(B>110)&((R-G)>45)&((B-G)>45)
    soft=(R>150)&(B>150)&((R-G)>16)&((B-G)>16)
    grow=magcore.copy()
    for _ in range(3):
        g2=grow.copy()
        g2[1:,:]|=grow[:-1,:]; g2[:-1,:]|=grow[1:,:]
        g2[:,1:]|=grow[:,:-1]; g2[:,:-1]|=grow[:,1:]
        grow=g2
    mag = magcore | (grow & soft)
    wht=(R>236)&(G>236)&(B>236)
    bg=np.zeros((H,W),bool); q=deque()
    for x in range(W):
        for y in (0,H-1):
            if wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    while q:
        cy,cx=q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=cy+dy,cx+dx
            if 0<=ny<H and 0<=nx<W and wht[ny,nx] and not bg[ny,nx]:
                bg[ny,nx]=True; q.append((ny,nx))
    fg = ~bg & ~mag

    # 칸 나누기 : 캐릭터+봉을 통째로 본 덩어리
    both = ~bg
    colf=both.sum(0); thr=H*0.01
    cr=[];cur=None
    for x in range(W):
        if colf[x]>thr: cur=[x,x] if cur is None else [cur[0],x]
        elif cur:
            if cur[1]-cur[0]>W*0.05: cr.append(cur)
            cur=None
    if cur and cur[1]-cur[0]>W*0.05: cr.append(cur)
    mg=[]
    for r in cr:
        if mg and r[0]-mg[-1][1] < W*0.02: mg[-1][1]=r[1]
        else: mg.append(list(r))
    if len(mg)!=len(keys):
        step=W//len(keys); mg=[[i*step,(i+1)*step-1] for i in range(len(keys))]
        print('  ! 덩어리 %d개 — 균등 분할'%len(cr))

    meta={}
    for i,key in enumerate(keys):
        x0=max(0,mg[i][0]-4); x1=min(W,mg[i][1]+5)
        sub=fg[:,x0:x1].copy(); subm=mag[:,x0:x1]; subc=magcore[:,x0:x1]; suba=a[:,x0:x1].copy()
        if not subc.any(): print('  ! %s 봉 없음'%key); continue

        # ── 봉의 축(주성분) ────────────────────────────────────────
        ys,xs=np.where(subc)
        P=np.stack([xs.astype(float),ys.astype(float)],1); c0=P.mean(0); Q=P-c0
        ev,evec=np.linalg.eigh((Q.T@Q)/len(Q))
        ax=evec[:,np.argmax(ev)]
        if ax[1]>0: ax=-ax                       # 위쪽을 향하게
        ang=math.atan2(ax[1],ax[0])              # 봉이 향하는 방향(캔버스 좌표)
        perp=np.array([-ax[1],ax[0]])
        t=Q@ax; u=Q@perp
        rodw=float(np.percentile(u,95)-np.percentile(u,5))

        # ── 봉 둘레의 '연보라 후광'을 축 기준으로 지운다 ─────────
        #   3px 늘리기로는 못 잡는다(봉 밖에 창백한 띠가 남았다).
        #   봉의 직선에서 수직거리가 가까운 창백한 화소를 통째로 배경으로 돌린다.
        Hs0,Ws0 = sub.shape
        yy0,xx0 = np.mgrid[0:Hs0,0:Ws0]
        dxp = (xx0-c0[0]); dyp=(yy0-c0[1])
        dperp = np.abs(dxp*perp[0] + dyp*perp[1])
        dalong= dxp*ax[0] + dyp*ax[1]
        #   색으로 가르려다 계속 남았다. 그냥 '봉이 지나간 띠'를 통째로 지우고,
        #   캐릭터를 관통한 부분만 아래에서 다시 메운다. 판정이 필요 없다.
        band = (dperp <= rodw*1.15) & (dalong>=t.min()-8) & (dalong<=t.max()+8)
        #   띠 안에서 '캐릭터 색이 아닌 것'만 지운다. 손가락(주황·크림)은 살린다.
        mn=suba.min(2); mx2=suba.max(2)
        rodish = mag[:,x0:x1] | ((mn>150)&((mx2-mn)<48))      # 마젠타 또는 창백·무채색
        subm = band & rodish
        sub = sub & ~subm

        # 손이 봉을 가린 구간 = t 축에서 마젠타가 끊긴 자리
        NB=60; tt0,tt1=t.min(),t.max()
        occ=np.zeros(NB,bool)
        for b in range(NB):
            lo=tt0+(tt1-tt0)*b/NB; hi=tt0+(tt1-tt0)*(b+1)/NB
            occ[b]= ((t>=lo)&(t<=hi)).sum() < 3
        runs=[];cur=None
        for b in range(NB):
            if occ[b]: cur=[b,b] if cur is None else [cur[0],b]
            elif cur: runs.append(cur); cur=None
        if cur: runs.append(cur)
        inner=[r for r in runs if r[0]>2 and r[1]<NB-3]
        if inner:
            r=max(inner,key=lambda z:z[1]-z[0])
            gt=tt0+(tt1-tt0)*((r[0]+r[1]+1)/2.0)/NB
            fisth=(tt1-tt0)*(r[1]-r[0]+1)/NB
        else:
            gt=0.0; fisth=rodw*1.8
        gp = c0 + ax*gt

        # 바닥 그림자 제거
        yb=int(sub.shape[0]*0.82)
        nearw=(suba[:,:,0]>230)&(suba[:,:,1]>230)&(suba[:,:,2]>230)
        sub[yb:,:] = sub[yb:,:] & ~nearw[yb:,:]
        # ── 봉이 캐릭터를 관통한 자리 메우기 ─────────────────────
        #   ★ 봉이 기울어져 있으므로 '가로줄'로 메우면 대각선으로 번져 검은 띠가 생긴다
        #      (실제로 생겼다). 봉 축에 '수직인 방향'으로 메운다.
        px_,py_ = float(perp[0]), float(perp[1])
        Hs,Ws = sub.shape
        mys,mxs = np.where(subm)
        for yy,xx in zip(mys,mxs):
            found=None
            for sgn in (1.0,-1.0):
                pass
            # 양쪽으로 봉을 벗어날 때까지 걸어간다
            def walk(sgn):
                k=1.0
                while k<60:
                    nx=int(round(xx+px_*sgn*k)); ny=int(round(yy+py_*sgn*k))
                    if nx<0 or ny<0 or nx>=Ws or ny>=Hs: return None
                    if not subm[ny,nx]:
                        nx2=int(round(xx+px_*sgn*(k+3))); ny2=int(round(yy+py_*sgn*(k+3)))
                        if nx2<0 or ny2<0 or nx2>=Ws or ny2>=Hs: return None
                        if not sub[ny2,nx2]: return None
                        return (ny2,nx2,k+3)
                    k+=1.0
                return None
            A=walk(1.0); Bq=walk(-1.0)
            if A and Bq:
                ca=suba[A[0],A[1]].astype(float); cb=suba[Bq[0],Bq[1]].astype(float)
                if abs(ca[0]-cb[0])<70 and abs(ca[1]-cb[1])<70 and abs(ca[2]-cb[2])<70:
                    w=Bq[2]/float(A[2]+Bq[2])
                    suba[yy,xx]=ca*w+cb*(1-w)
                    sub[yy,xx]=True

        ys2=np.where(sub.any(1))[0]; xs2=np.where(sub.any(0))[0]
        by0,by1,bx0,bx1=ys2[0],ys2[-1],xs2[0],xs2[-1]
        bw=bx1-bx0+1; bh=by1-by0+1
        scale=(OUT*0.917)/bh
        nw=int(round(bw*scale)); nh=int(round(bh*scale))
        cell=np.zeros((bh,bw,4),np.uint8)
        for yy in range(bh):
            for xx in range(bw):
                if sub[by0+yy,bx0+xx]:
                    cell[yy,xx,0:3]=suba[by0+yy,bx0+xx]; cell[yy,xx,3]=255
        img=Image.fromarray(cell,'RGBA').resize((nw,nh), Image.LANCZOS)
        canv=Image.fromarray(np.zeros((OUT,OUT,4),np.uint8),'RGBA')
        ox=(OUT-nw)//2; oy=int(round(OUT*BASE_F))-nh
        canv.paste(img,(ox,oy),img)
        canv.save('art/%s.webp'%key,'WEBP',quality=95,method=6)

        gx=(gp[0]-bx0)*scale+ox; gy=(gp[1]-by0)*scale+oy
        fh=fisth*scale
        meta[key]=dict(hx=round(float(gx)/OUT-0.5,4), hy=round(float(gy)/OUT-BASE_F,4),
                       d=round(float(fh)/OUT,4), ang=round(float(ang),4),
                       fx0=round(float(gx-fh*0.80)/OUT,4), fx1=round(float(gx+fh*0.80)/OUT,4),
                       fy0=round(float(gy-fh*0.80)/OUT,4), fy1=round(float(gy+fh*0.80)/OUT,4))
        print('  %-16s 쥐는점(%.4f, %.4f) 자루각 %+.3f rad (%.1f°) 주먹 %.3f'%(
              key,meta[key]['hx'],meta[key]['hy'],meta[key]['ang'],
              math.degrees(meta[key]['ang']),meta[key]['d']))
    p='art/hero_pose.json'
    old=json.load(open(p)) if os.path.exists(p) else {}
    old.update(meta); json.dump(old,open(p,'w'),indent=1)
    return meta

if __name__=='__main__':
    cut(sys.argv[1], sys.argv[2:])
