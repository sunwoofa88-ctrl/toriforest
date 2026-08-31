# -*- coding: utf-8 -*-
"""AI가 그린 '조합별 완성 전신' 그림(흰 배경) -> art/hero_<armor>_<head>.webp
   기존 heroW_light.webp와 정확히 같은 프레이밍 규약(192 캔버스 안에서 캐릭터
   실루엣이 차지하는 픽셀 범위: x 34~156, y 3~178)에 맞춰 배치한다.
   heroGeared()가 이 파일도 heroW_*와 완전히 동일한 artCanvas() 호출로
   재배치하므로, 원본 프레이밍이 heroW_light와 다르면 화면에서 크기가
   달라진다(맨몸/갑옷 크기 불일치 버그의 재발). 그래서 짐작 없이 heroW_light.webp
   실측치를 그대로 목표 박스로 재사용한다."""
from PIL import Image
import numpy as np, sys, os
from collections import deque

OUT = 192
TX0, TY0, TX1, TY1 = 34, 3, 156, 178   # heroW_light.webp 실측 bbox (그대로 재사용)

def cut(src, dst):
    im = Image.open(src).convert('RGB')
    a = np.array(im).astype(int)
    H, W, _ = a.shape
    R, G, B = a[:,:,0], a[:,:,1], a[:,:,2]
    wht = (R>236) & (G>236) & (B>236)
    bg = np.zeros((H,W), bool)
    q = deque()
    for x in range(W):
        for y in (0, H-1):
            if wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    for y in range(H):
        for x in (0, W-1):
            if wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    while q:
        cy,cx = q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx = cy+dy, cx+dx
            if 0<=ny<H and 0<=nx<W and wht[ny,nx] and not bg[ny,nx]:
                bg[ny,nx]=True; q.append((ny,nx))
    fg = ~bg

    # 발밑 흰 그림자 제거(다른 슬라이서와 동일 처리)
    yb = int(H*0.90)
    nearw = (R>228)&(G>228)&(B>228)
    fg[yb:,:] = fg[yb:,:] & ~nearw[yb:,:]

    ys, xs = np.where(fg.any(1))[0], np.where(fg.any(0))[0]
    by0, by1 = ys[0], ys[-1]
    bx0, bx1 = xs[0], xs[-1]
    bw, bh = bx1-bx0+1, by1-by0+1

    cell = np.zeros((bh,bw,4), np.uint8)
    sub = fg[by0:by1+1, bx0:bx1+1]
    suba = a[by0:by1+1, bx0:bx1+1]
    cell[...,0:3] = suba
    cell[...,3] = sub.astype(np.uint8)*255
    tw, th = TX1-TX0+1, TY1-TY0+1
    scale = min(tw/float(bw), th/float(bh))
    nw, nh = max(1,int(round(bw*scale))), max(1,int(round(bh*scale)))
    img = Image.fromarray(cell, 'RGBA').resize((nw,nh), Image.LANCZOS)
    canv = Image.new('RGBA', (OUT,OUT), (0,0,0,0))
    ox = TX0 + (tw-nw)//2
    oy = TY1 - nh + 1   # 발밑을 목표 박스 하단(TY1)에 맞춘다
    canv.paste(img, (ox,oy), img)
    canv.save(dst, 'WEBP', quality=95, method=6)
    print('  %-28s src %dx%d bbox %dx%d -> %dx%d @ (%d,%d)' % (
        os.path.basename(dst), W,H, bw,bh, nw,nh, ox,oy))

if __name__ == '__main__':
    cut(sys.argv[1], sys.argv[2])
