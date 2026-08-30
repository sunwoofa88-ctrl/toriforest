#!/usr/bin/env python3
"""Gemini 2x2 시트 → 종별 스프라이트
   ① 4등분  ② 흰 배경 투명화  ③ 알파 경계로 자르기
   ④ 정사각 캔버스에 발이 바닥선(112/120)에 오도록 배치  ⑤ WebP 저장"""
import sys, os, json, io
from PIL import Image
import numpy as np

OUT_PX  = 192
BASE_F  = 112/120.0      # 게임의 발밑 기준선
FILL    = 0.88           # 캔버스 대비 캐릭터 크기

def deband(im):
    """가장자리에서 흰색 영역을 flood fill 로 지운다 (안쪽 흰색은 남긴다)"""
    a = np.array(im.convert('RGBA')).astype(np.int16)
    h,w,_ = a.shape
    rgb = a[:,:,:3]
    # 흰색 후보 : 아주 밝고 채도 낮음
    mx = rgb.max(axis=2); mn = rgb.min(axis=2)
    white = (mn > 228) & ((mx-mn) < 26)
    # 격자선(연회색)도 배경으로 본다
    grey  = (mn > 195) & ((mx-mn) < 14)
    cand  = white | grey
    # 가장자리에서 BFS
    seen = np.zeros((h,w), bool)
    from collections import deque
    q = deque()
    for x in range(w):
        for y in (0,h-1):
            if cand[y,x] and not seen[y,x]: seen[y,x]=True; q.append((y,x))
    for y in range(h):
        for x in (0,w-1):
            if cand[y,x] and not seen[y,x]: seen[y,x]=True; q.append((y,x))
    while q:
        y,x = q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx = y+dy, x+dx
            if 0<=ny<h and 0<=nx<w and cand[ny,nx] and not seen[ny,nx]:
                seen[ny,nx]=True; q.append((ny,nx))
    out = np.array(im.convert('RGBA'))
    out[seen,3] = 0
    # 경계 부드럽게 : 흰색에 가까운 반투명 픽셀의 알파를 낮춘다
    return Image.fromarray(out, 'RGBA')

def norm(im):
    """알파 경계로 자르고 정사각 캔버스에 배치"""
    bbox = im.getbbox()
    if not bbox: return None
    im = im.crop(bbox)
    w,h = im.size
    room = OUT_PX*FILL
    sc = min(room/w, (OUT_PX*BASE_F*0.98)/h)
    nw,nh = max(1,int(w*sc)), max(1,int(h*sc))
    im = im.resize((nw,nh), Image.LANCZOS)
    c = Image.new('RGBA',(OUT_PX,OUT_PX),(0,0,0,0))
    c.paste(im, ((OUT_PX-nw)//2, int(OUT_PX*BASE_F)-nh), im)
    return c

def split4(path):
    im = Image.open(path).convert('RGBA')
    W,H = im.size
    m = 6   # 격자선을 피해 안쪽으로
    return [ im.crop((m, m, W//2-m, H//2-m)),
             im.crop((W//2+m, m, W-m, H//2-m)),
             im.crop((m, H//2+m, W//2-m, H-m)),
             im.crop((W//2+m, H//2+m, W-m, H-m)) ]

if __name__=='__main__':
    src, outdir, keys = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
    os.makedirs(outdir, exist_ok=True)
    quads = split4(src)
    for q,k in zip(quads, keys):
        r = norm(deband(q))
        if r is None: print('빈 칸:', k); continue
        r.save(os.path.join(outdir, k+'.webp'), 'WEBP', quality=88, method=6)
        print('저장', k, r.size)
