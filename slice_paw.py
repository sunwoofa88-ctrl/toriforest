# -*- coding: utf-8 -*-
"""Gemini 손 시트(마젠타 봉을 쥔 주먹 4개) → 게임용 손 레이어 4장 + 파지 좌표.
   마젠타 봉이 '정답 자'다. 봉의 중심축 = 자루가 지나갈 선, 주먹 중심 = 쥐는 점.
   추측이 개입할 여지가 구조적으로 없다."""
from PIL import Image
import numpy as np, json, sys

SRC = sys.argv[1] if len(sys.argv)>1 else '/mnt/user-data/uploads/Downloads/paw4.png'
NAMES = ['hand_bare','hand_leather','hand_steel','hand_magic']
OUT_PX = 256

im = Image.open(SRC).convert('RGB')
a  = np.array(im).astype(int); H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
mag  = (R>110)&(B>110)&((R-G)>45)&((B-G)>45)   # 봉 잔티까지 확실히
whit = (R>238)&(G>238)&(B>238)

cols = mag.sum(0); runs=[]; cur=None
for x in range(W):
    if cols[x] > H*0.05:
        cur = [x,x] if cur is None else [cur[0],x]
    elif cur: runs.append(cur); cur=None
if cur: runs.append(cur)
assert len(runs)==4, '마젠타 기둥 %d개 (4개여야 함)'%len(runs)

centers = [ (r[0]+r[1])/2.0 for r in runs ]
pitch   = (centers[-1]-centers[0])/3.0
half    = pitch/2.0
meta = {}

for i,(name,rr) in enumerate(zip(NAMES,runs)):
    cx0 = centers[i]
    x0 = int(max(0, cx0-half)); x1 = int(min(W, cx0+half))
    cell_rgb = a[:, x0:x1]; cell_mag = mag[:, x0:x1]; cell_wht = whit[:, x0:x1]
    h,w = cell_mag.shape

    # 알파 : 흰 배경과 마젠타 봉을 뺀 나머지 = 손
    alpha = (~cell_wht) & (~cell_mag)
    # 흰 배경 판정이 손 안쪽 밝은 부분까지 먹지 않도록, 가장자리에서 흘러온 흰색만 배경으로 본다
    from collections import deque
    bg = np.zeros((h,w), bool); q=deque()
    for x in range(w):
        for y in (0,h-1):
            if cell_wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    for y in range(h):
        for x in (0,w-1):
            if cell_wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    while q:
        cy,cxx=q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=cy+dy,cxx+dx
            if 0<=ny<h and 0<=nx<w and cell_wht[ny,nx] and not bg[ny,nx]:
                bg[ny,nx]=True; q.append((ny,nx))
    alpha = (~bg) & (~cell_mag)

    # ── 봉의 '테두리선'은 마젠타가 아니라 살아남는다. 그래서 주먹 구간을 먼저 찾고,
    #    그 바깥의 봉(테두리 포함)을 통째로 지운다. 주먹 구간 = 폭이 봉보다 훨씬 넓은 행.
    rodband = (rr[1]-rr[0]+1) + 24                 # 봉 + 테두리 여유
    wid = alpha.sum(1)
    fr = [y for y in range(h) if wid[y] > rodband*1.8]
    assert fr, '주먹 행을 못 찾음'
    fy0, fy1 = fr[0], fr[-1]
    keep = np.zeros((h,w), bool); keep[fy0:fy1+1,:] = True
    alpha = alpha & keep

    # 손 = 알파 중 가장 큰 연결성분
    seen=np.zeros((h,w),bool); best=None
    for y in range(h):
        for x in range(w):
            if alpha[y,x] and not seen[y,x]:
                q=deque([(y,x)]); seen[y,x]=True; px=[]
                while q:
                    cy,cxx=q.popleft(); px.append((cy,cxx))
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                        ny,nx=cy+dy,cxx+dx
                        if 0<=ny<h and 0<=nx<w and alpha[ny,nx] and not seen[ny,nx]:
                            seen[ny,nx]=True; q.append((ny,nx))
                if best is None or len(px)>len(best): best=px
    hand=np.zeros((h,w),bool)
    for y,x in best: hand[y,x]=True

    ys=[p[0] for p in best]; xs=[p[1] for p in best]
    by0,by1,bx0,bx1 = min(ys),max(ys),min(xs),max(xs)

    # 봉 중심축 x (셀 좌표) · 봉 폭
    rod_cx = (rr[0]+rr[1])/2.0 - x0
    rod_w  = rr[1]-rr[0]+1
    # 쥐는 점 y = 주먹(손 성분)의 세로 중심
    grip_y = (by0+by1)/2.0

    # 정사각 크롭 : 쥐는 점이 한가운데 오도록
    side = int(max(bx1-bx0, by1-by0) * 1.34)
    cxs, cys = rod_cx, grip_y
    sx0 = int(round(cxs - side/2)); sy0 = int(round(cys - side/2))
    canv = np.zeros((side, side, 4), np.uint8)
    for yy in range(side):
        sy = sy0+yy
        if sy<0 or sy>=h: continue
        for xx in range(side):
            sx = sx0+xx
            if sx<0 or sx>=w or not hand[sy,sx]: continue
            canv[yy,xx,0:3] = cell_rgb[sy,sx]; canv[yy,xx,3]=255

    img = Image.fromarray(canv,'RGBA').resize((OUT_PX,OUT_PX), Image.LANCZOS)
    img.save('art/%s.webp'%name, 'WEBP', quality=95, method=6)

    meta[name] = dict(
        grip = [0.5, 0.5],                     # 쥐는 점 = 그림 정중앙 (위처럼 잘랐다)
        rodW = round(rod_w/side, 4),           # 자루 굵기 / 그림 크기
        # 손 실루엣이 쥐는 점 기준으로 위·아래·좌·우로 얼마나 뻗는지 (자루 가림 계산용)
        up   = round((cys-by0)/side,4), down=round((by1-cys)/side,4),
        left = round((cxs-bx0)/side,4), right=round((bx1-cxs)/side,4),
        px   = OUT_PX)
    print('%-12s 셀 %4d..%4d  손 x%3d..%3d y%3d..%3d  봉중심x %.1f 폭 %d  → %dpx  자루굵기 %.3f'%(
        name,x0,x1,bx0,bx1,by0,by1,rod_cx,rod_w,side,meta[name]['rodW']))

json.dump(meta, open('art/hand_meta.json','w'), indent=1)
print('\n저장 완료 :', list(meta))
