# -*- coding: utf-8 -*-
"""주인공 방향별 그림(앞·뒤·옆) → hero_back / hero_side.
   기존 hero_idle 과 같은 틀(가로 가운데, 발밑 BASE_F)에 맞춰 넣는다."""
from PIL import Image
import numpy as np, sys
from collections import deque
BASE_F=112/120.0; OUT=192
src=sys.argv[1]; keys=sys.argv[2:]
im=Image.open(src).convert('RGB'); a=np.array(im).astype(int); H,W,_=a.shape
R,G,B=a[:,:,0],a[:,:,1],a[:,:,2]
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
fg=~bg
col=fg.sum(0); thr=H*0.01
runs=[];cur=None
for x in range(W):
    if col[x]>thr: cur=[x,x] if cur is None else [cur[0],x]
    elif cur:
        if cur[1]-cur[0]>W*0.05: runs.append(cur)
        cur=None
if cur and cur[1]-cur[0]>W*0.05: runs.append(cur)
mg=[]
for r in runs:
    if mg and r[0]-mg[-1][1]<W*0.03: mg[-1][1]=r[1]
    else: mg.append(list(r))
if len(mg)!=len(keys):
    step=W//len(keys); mg=[[i*step,(i+1)*step-1] for i in range(len(keys))]
for (x0,x1),key in zip(mg,keys):
    sub=fg[:,x0:x1+1].copy()
    # 옆 칸에서 딸려 온 조각 제거 : 가장 큰 연결성분만 남긴다
    Hs,Ws=sub.shape; lab=np.zeros((Hs,Ws),np.int32); cur=0; best=(0,0)
    for yy in range(Hs):
        for xx in range(Ws):
            if sub[yy,xx] and lab[yy,xx]==0:
                cur+=1; qq=deque([(yy,xx)]); lab[yy,xx]=cur; n=0
                while qq:
                    cy,cx=qq.popleft(); n+=1
                    for dy in (-1,0,1):
                        for dx in (-1,0,1):
                            ny,nx=cy+dy,cx+dx
                            if 0<=ny<Hs and 0<=nx<Ws and sub[ny,nx] and lab[ny,nx]==0:
                                lab[ny,nx]=cur; qq.append((ny,nx))
                if n>best[0]: best=(n,cur)
    if best[1]: sub=(lab==best[1])
    ys=np.where(sub.any(1))[0]; xs=np.where(sub.any(0))[0]
    by0,by1,bx0,bx1=ys[0],ys[-1],xs[0],xs[-1]
    bw=bx1-bx0+1; bh=by1-by0+1
    cell=np.zeros((bh,bw,4),np.uint8)
    for yy in range(bh):
        for xx in range(bw):
            if sub[by0+yy,bx0+xx]:
                cell[yy,xx,0:3]=a[by0+yy, x0+bx0+xx]; cell[yy,xx,3]=255
    scale=(OUT*0.917)/bh
    nw=int(round(bw*scale)); nh=int(round(bh*scale))
    img=Image.fromarray(cell,'RGBA').resize((nw,nh), Image.LANCZOS)
    canv=Image.fromarray(np.zeros((OUT,OUT,4),np.uint8),'RGBA')
    canv.paste(img,((OUT-nw)//2, int(round(OUT*BASE_F))-nh), img)
    canv.save('art/%s.webp'%key,'WEBP',quality=95,method=6)
    print('  %-12s %dx%d → %dpx'%(key,bw,bh,OUT))
