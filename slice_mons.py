# -*- coding: utf-8 -*-
"""몬스터 시트(가로 4마리, 흰 배경) → art/<종키>.webp 4장.
   흰 배경은 '가장자리에서 흘러온 흰색'만 지운다(몸 안쪽 밝은 부분을 안 먹게).
   각 마리는 알파 bbox 로 꽉 잘라 정사각 캔버스에 발을 바닥에 맞춰 앉힌다."""
from PIL import Image
import numpy as np, sys, os
from collections import deque

OUT_PX = 384

def cut(src, keys):
    im = Image.open(src).convert('RGB')
    a = np.array(im).astype(int); H,W,_ = a.shape
    R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
    wht = (R>236)&(G>236)&(B>236)
    # 가장자리에서 흘러온 흰색만 배경
    bg = np.zeros((H,W),bool); q=deque()
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
    fg = ~bg
    # ── 먼저 '줄'을 나눈다 (2줄 격자 시트 대응) ──
    rowproj = fg.sum(1); rthr = W*0.012
    rr=[];cur=None
    for y in range(H):
        if rowproj[y]>rthr: cur=[y,y] if cur is None else [cur[0],y]
        elif cur:
            if cur[1]-cur[0] > H*0.06: rr.append(cur)
            cur=None
    if cur and cur[1]-cur[0] > H*0.06: rr.append(cur)
    mrows=[]
    for r in rr:
        if mrows and r[0]-mrows[-1][1] < H*0.03: mrows[-1][1]=r[1]
        else: mrows.append(list(r))
    percol = len(keys)//max(1,len(mrows)) if mrows else len(keys)
    if len(mrows)>1 and percol*len(mrows)==len(keys):
        out=[]
        for ri,(ry0,ry1) in enumerate(mrows):
            sub = np.zeros_like(fg); sub[ry0:ry1+1,:] = fg[ry0:ry1+1,:]
            out += _cutrow(a, sub, keys[ri*percol:(ri+1)*percol], W, H)
        return out
    return _cutrow(a, fg, keys, W, H)

def _cutrow(a, fg, keys, W, H):
    # 세로로 잉크가 있는 x 구간 = 개체.
    col = fg.sum(0)
    thr = H*0.02
    runs=[]; cur=None
    for x in range(W):
        if col[x]>thr:
            cur=[x,x] if cur is None else [cur[0],x]
        elif cur:
            if cur[1]-cur[0] > W*0.04: runs.append(cur)
            cur=None
    if cur and cur[1]-cur[0] > W*0.04: runs.append(cur)
    # 가까운 덩어리 합치기 (한 마리가 두 덩어리로 갈릴 때)
    merged=[]
    for r in runs:
        if merged and r[0]-merged[-1][1] < W*0.035: merged[-1][1]=r[1]
        else: merged.append(list(r))
    if len(merged)!=len(keys):
        print('  ! 덩어리 %d개 (기대 %d) — 균등 분할로 대체'%(len(merged),len(keys)))
        step=W//len(keys); merged=[[i*step, (i+1)*step-1] for i in range(len(keys))]
    saved=[]
    for (x0,x1),key in zip(merged,keys):
        sub = fg[:, x0:x1+1]
        ys = np.where(sub.any(1))[0]
        if len(ys)==0: print('  ! %s 빈 칸'%key); continue
        # ── 글자 줄 버리기 ───────────────────────────────────────
        #   AI 가 이름표를 붙여 놓는 일이 잦다(실제로 두 번 그랬다). 칸 안에서
        #   세로로 떨어진 덩어리를 모두 찾아 '잉크가 가장 많은 덩어리' 하나만 남긴다.
        #   글자는 얇고 성기므로 언제나 지고, 생물이 이긴다.
        rp = sub.sum(1)
        segs=[]; cur=None
        for yy in range(sub.shape[0]):
            if rp[yy]>0: cur=[yy,yy] if cur is None else [cur[0],yy]
            elif cur: segs.append(cur); cur=None
        if cur: segs.append(cur)
        m2=[]
        for sg in segs:
            if m2 and sg[0]-m2[-1][1] <= 3: m2[-1][1]=sg[1]
            else: m2.append(list(sg))
        if len(m2)>1:
            best=max(m2, key=lambda g: int(rp[g[0]:g[1]+1].sum()))
            keepmask=np.zeros_like(sub); keepmask[best[0]:best[1]+1,:]=sub[best[0]:best[1]+1,:]
            sub=keepmask
            ys=np.where(sub.any(1))[0]
            if len(ys)==0: print('  ! %s 빈 칸'%key); continue
        # ── 옆 칸에서 삐져 들어온 조각 버리기 ─────────────────────
        #   균등 분할로 자를 때 이웃 생물의 끄트머리가 딸려 온다(실제로 그랬다).
        #   칸 안에서 서로 붙어 있는 덩어리를 모두 찾아 가장 큰 것만 남긴다.
        lab=np.zeros(sub.shape, np.int32); cur=0; best=(0,0)
        H2,W2=sub.shape
        for yy in range(H2):
            for xx in range(W2):
                if sub[yy,xx] and lab[yy,xx]==0:
                    cur+=1; q=deque([(yy,xx)]); lab[yy,xx]=cur; n=0
                    while q:
                        cy,cx=q.popleft(); n+=1
                        for dy in (-1,0,1):
                            for dx in (-1,0,1):
                                ny,nx=cy+dy,cx+dx
                                if 0<=ny<H2 and 0<=nx<W2 and sub[ny,nx] and lab[ny,nx]==0:
                                    lab[ny,nx]=cur; q.append((ny,nx))
                    if n>best[0]: best=(n,cur)
        if best[1]: sub = (lab==best[1])
        ys=np.where(sub.any(1))[0]
        if len(ys)==0: print('  ! %s 빈 칸'%key); continue
        xs = np.where(sub.any(0))[0]
        y0,y1 = ys[0],ys[-1]; ax0,ax1 = xs[0],xs[-1]
        w = ax1-ax0+1; h = y1-y0+1
        side = int(max(w,h)*1.06)
        canv = np.zeros((side,side,4),np.uint8)
        offx = (side-w)//2
        offy = side-h                      # 발을 바닥에 붙인다
        for yy in range(h):
            sy=y0+yy
            for xx in range(w):
                sx=x0+ax0+xx
                if not sub[sy, ax0+xx]: continue
                canv[offy+yy, offx+xx, 0:3] = a[sy,sx]
                canv[offy+yy, offx+xx, 3] = 255
        img = Image.fromarray(canv,'RGBA').resize((OUT_PX,OUT_PX), Image.LANCZOS)
        img.save('art/%s.webp'%key, 'WEBP', quality=92, method=6)
        saved.append(key)
        print('  %-12s x%4d..%4d  %dx%d → %dpx'%(key,x0,x1,w,h,OUT_PX))
    return saved

if __name__=='__main__':
    src=sys.argv[1]; keys=sys.argv[2:]
    print(os.path.basename(src), '→', ' '.join(keys))
    cut(src, keys)
