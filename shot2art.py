#!/usr/bin/env python3
"""캡처 이미지(흰 배경에 스프라이트 2장) → 종별 WebP 스프라이트"""
import sys, os
from PIL import Image
import numpy as np
from collections import deque

OUT_PX, BASE_F, FILL = 192, 112/120.0, 0.90

def key_white(im):
    a = np.array(im.convert('RGBA'))
    rgb = a[:,:,:3].astype(np.int16)
    mx = rgb.max(axis=2); mn = rgb.min(axis=2)
    cand = (mn > 205) & ((mx-mn) < 34)          # JPEG 링잉을 감안해 넉넉히
    h,w = cand.shape
    seen = np.zeros((h,w), bool); q = deque()
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
    a[seen,3] = 0
    return Image.fromarray(a,'RGBA')

def despeck(im, keep_frac=0.012):
    """붙어 있지 않은 아주 작은 조각(JPEG 잔여물·옆 칸 부스러기)만 지운다.
       유령의 떠 있는 손(본체 대비 3~6%)은 남기고, 0.5% 미만 티끌만 제거한다 — 실측 기준 1.2%."""
    from scipy import ndimage
    a = np.array(im)
    m = a[:,:,3] > 24
    lab, n = ndimage.label(m)
    if n <= 1: return im
    sizes = ndimage.sum(m, lab, range(1, n+1))
    big = sizes.max()
    kill = np.zeros(n+1, bool)
    for i,sz in enumerate(sizes, start=1):
        if sz < big*keep_frac: kill[i] = True
    a[kill[lab], 3] = 0
    return Image.fromarray(a, 'RGBA')

def norm(im):
    bb = im.getbbox()
    if not bb: return None
    im = im.crop(bb); w,h = im.size
    if w<40 or h<40: return None
    sc = min(OUT_PX*FILL/w, OUT_PX*BASE_F*0.99/h)
    nw,nh = max(1,int(w*sc)), max(1,int(h*sc))
    im = im.resize((nw,nh), Image.LANCZOS)
    c = Image.new('RGBA',(OUT_PX,OUT_PX),(0,0,0,0))
    c.paste(im, ((OUT_PX-nw)//2, int(OUT_PX*BASE_F)-nh), im)
    return c

def process(path, keys, outdir='art', top_frac=1.0):
    """캡처 1장 = 가로로 나열된 N마리"""
    os.makedirs(outdir, exist_ok=True)
    im = Image.open(path).convert('RGBA')
    W,H = im.size
    if top_frac < 1.0:
        # Gemini 가 아이템 아래에 영어 이름을 적어 넣는 경우가 있다 → 아래를 잘라낸다
        im = im.crop((0,0,W,int(H*top_frac))); W,H = im.size
    n = len(keys)
    done=[]
    for i,k in enumerate(keys):
        half = im.crop((i*W//n, 0, (i+1)*W//n, H))
        r = norm(key_white(half))
        if r is None: print('  빈칸', k); continue
        r.save(os.path.join(outdir, k+'.webp'), 'WEBP', quality=90, method=6)
        done.append(k)
    return done

if __name__=='__main__':
    print(process(sys.argv[1], sys.argv[2].split(',')))

def smart_split(path, keys, outdir='art', top_frac=1.0):
    """Gemini 가 2×2 가 아니라 1×4 · 1×8 로 뽑는 경우가 있다(실제로 발생).
       고정 분할 대신 '빈 열'을 찾아 덩어리 단위로 자른다 — 배치가 뭐든 맞는다."""
    im = Image.open(path).convert('RGBA')
    W,H = im.size
    if top_frac < 1.0:
        im = im.crop((0,0,W,int(H*top_frac))); W,H = im.size
    keyed = key_white(im)
    a = np.array(keyed)[:,:,3] > 24
    colsum = a.sum(axis=0)
    thr = max(2, int(H*0.004))
    # 빈 열로 덩어리 나누기
    groups, cur = [], None
    for x in range(W):
        if colsum[x] > thr:
            if cur is None: cur = [x,x]
            else: cur[1] = x
        else:
            if cur is not None and cur[1]-cur[0] > W*0.02: groups.append(tuple(cur))
            cur = None
    if cur is not None and cur[1]-cur[0] > W*0.02: groups.append(tuple(cur))
    if not groups:
        return []
    # 덩어리가 필요한 수보다 많으면 큰 것부터 고른다(작은 것은 부스러기)
    n = len(keys)
    if len(groups) > n:
        groups = sorted(sorted(groups, key=lambda g:-(g[1]-g[0]))[:n])
    os.makedirs(outdir, exist_ok=True)
    done=[]
    # ★ 경계를 '이웃 덩어리와의 중점'까지 넓힌다.
    #   유령의 떠 있는 손처럼 몸통과 떨어진 부위가 6% 패딩 밖으로 나가 잘려 나갔다(실측: volcano_10 오른손).
    #   중점까지 넓히면 떨어진 부위를 흡수하면서도 옆 칸을 침범하지 않는다.
    bnds=[]
    for i,g in enumerate(groups):
        own = max(8, int((g[1]-g[0])*0.06))
        L = (groups[i-1][1]+g[0])//2 if i>0        else max(0, g[0]-own)
        R = (groups[i+1][0]+g[1])//2 if i<len(groups)-1 else min(W, g[1]+own)
        bnds.append((max(0,L), min(W,R+1)))
    for (L,R),k in zip(bnds, keys):
        cell = despeck(keyed.crop((L, 0, R, H)))
        r = norm(cell)
        if r is None: continue
        r.save(os.path.join(outdir, k+'.webp'), 'WEBP', quality=90, method=6)
        done.append(k)
    return done, len(groups)


def _bands(cov, thr, minlen):
    g=[]; cur=None
    for i,v in enumerate(cov):
        if v > thr:
            if cur is None: cur=[i,i]
            else: cur[1]=i
        else:
            if cur is not None and cur[1]-cur[0] >= minlen: g.append(tuple(cur))
            cur=None
    if cur is not None and cur[1]-cur[0] >= minlen: g.append(tuple(cur))
    return g

def degrid(mask):
    """Gemini 가 'no grid lines' 를 어기고 얇은 격자선을 그려 넣는 경우가 실제로 있다.
       '폭의 40% 이상을 덮는데 두께가 6px 이하'인 줄만 지운다.
       두께가 진짜 판별 기준이다 — 스프라이트에 6px 두께로 화면 절반을 가로지르는 부분은 없다.
       (실측: 격자선이 가운데 50% 구간만 그어진 시트가 있어 60% 기준으로는 안 걸렸다.)"""
    H,W = mask.shape
    out = mask.copy()
    for axis,(N,L) in ((0,(H,W)), (1,(W,H))):
        cov = (mask.sum(axis=1) if axis==0 else mask.sum(axis=0)) / float(L)
        run=[]
        for i in range(N):
            if cov[i] > 0.40: run.append(i)
            else:
                if run and len(run) <= 6:
                    for r in run:
                        if axis==0: out[r,:]=False
                        else: out[:,r]=False
                run=[]
        if run and len(run) <= 6:
            for r in run:
                if axis==0: out[r,:]=False
                else: out[:,r]=False
    return out

def grid_split(path, keys, outdir='art', top_frac=1.0, dump=None):
    """2×2 · 1×4 · 2×2+격자선 을 모두 처리한다.
       행 띠와 열 띠를 각각 찾아 배치를 판정하고 읽는 순서(좌→우, 위→아래)로 자른다."""
    im = Image.open(path).convert('RGBA')
    W,H = im.size
    if top_frac < 1.0:
        im = im.crop((0,0,W,int(H*top_frac))); W,H = im.size
    keyed = key_white(im)
    a = np.array(keyed)
    mask = a[:,:,3] > 24
    mask = degrid(mask)
    a[~mask,3] = 0
    keyed = Image.fromarray(a,'RGBA')

    rows = _bands(mask.sum(axis=1)/float(W), 0.004, int(H*0.04))
    cols = _bands(mask.sum(axis=0)/float(H), 0.004, int(W*0.02))
    n = len(keys)
    cells = []
    if len(rows) == 2 and len(cols) == 2:          # 2×2
        for r in rows:
            for c in cols: cells.append((c[0],r[0],c[1]+1,r[1]+1))
        layout='2x2'
    elif len(rows) == 1 and len(cols) >= n:        # 1×N
        cs = sorted(sorted(cols, key=lambda g:-(g[1]-g[0]))[:n])
        for i,c in enumerate(cs):
            L = (cs[i-1][1]+c[0])//2 if i>0        else c[0]-max(8,int((c[1]-c[0])*0.06))
            R = (cs[i+1][0]+c[1])//2 if i<len(cs)-1 else c[1]+max(8,int((c[1]-c[0])*0.06))
            cells.append((max(0,L), rows[0][0], min(W,R+1), rows[0][1]+1))
        layout='1x%d'%n
    else:
        return None, 'rows=%d cols=%d'%(len(rows),len(cols))

    os.makedirs(outdir, exist_ok=True)
    done=[]
    for (x0,y0,x1,y1),k in zip(cells, keys):
        pad = int(min(x1-x0, y1-y0)*0.04)
        cell = despeck(keyed.crop((max(0,x0-pad), max(0,y0-pad), min(W,x1+pad), min(H,y1+pad))))
        r = norm(cell)
        if r is None: continue
        r.save(os.path.join(outdir, k+'.webp'), 'WEBP', quality=90, method=6)
        done.append(k)
    return done, layout


def pick_split(path, keys, picks, outdir='art', top_frac=1.0):
    """Gemini 가 2×4(같은 종을 2안씩) 같은 변칙 배치를 내놓는 경우가 있다.
       눈으로 확인한 (열,행) 좌표를 직접 지정해 그 칸만 뽑는다 — 추측하지 않는다."""
    im = Image.open(path).convert('RGBA')
    W,H = im.size
    if top_frac < 1.0:
        im = im.crop((0,0,W,int(H*top_frac))); W,H = im.size
    keyed = key_white(im)
    a = np.array(keyed); mask = a[:,:,3] > 24
    mask = degrid(mask); a[~mask,3] = 0
    keyed = Image.fromarray(a,'RGBA')
    rows = _bands(mask.sum(axis=1)/float(W), 0.004, int(H*0.04))
    cols = _bands(mask.sum(axis=0)/float(H), 0.004, int(W*0.02))
    os.makedirs(outdir, exist_ok=True)
    done=[]
    for (ci,ri),k in zip(picks, keys):
        if ci>=len(cols) or ri>=len(rows): continue
        c,r = cols[ci], rows[ri]
        pad = int(min(c[1]-c[0], r[1]-r[0])*0.05)
        cell = despeck(keyed.crop((max(0,c[0]-pad), max(0,r[0]-pad),
                                   min(W,c[1]+1+pad), min(H,r[1]+1+pad))))
        res = norm(cell)
        if res is None: continue
        res.save(os.path.join(outdir, k+'.webp'), 'WEBP', quality=90, method=6)
        done.append(k)
    return done, 'rows=%d cols=%d'%(len(rows),len(cols))


def norm_center(im, px=192, fill=0.94):
    """장비 착용 레이어용 : 캐릭터처럼 발밑 정렬이 아니라 프레임 정중앙에 맞춘다."""
    bb = im.getbbox()
    if not bb: return None
    im = im.crop(bb); w,h = im.size
    if w<30 or h<30: return None
    sc = min(px*fill/w, px*fill/h)
    nw,nh = max(1,int(w*sc)), max(1,int(h*sc))
    im = im.resize((nw,nh), Image.LANCZOS)
    c = Image.new('RGBA',(px,px),(0,0,0,0))
    c.paste(im, ((px-nw)//2, (px-nh)//2), im)
    return c

def gear_split(path, keys, outdir='art', top_frac=1.0):
    """장비 착용 레이어 시트(2×2 또는 1×N) → 부위별 WebP. 정중앙 정렬."""
    im = Image.open(path).convert('RGBA')
    W,H = im.size
    if top_frac < 1.0:
        im = im.crop((0,0,W,int(H*top_frac))); W,H = im.size
    keyed = key_white(im)
    a = np.array(keyed); mask = a[:,:,3] > 24
    mask = degrid(mask); a[~mask,3] = 0
    keyed = Image.fromarray(a,'RGBA')
    rows = _bands(mask.sum(axis=1)/float(W), 0.004, int(H*0.04))
    cols = _bands(mask.sum(axis=0)/float(H), 0.004, int(W*0.02))
    n = len(keys); cells=[]
    if len(rows)==2 and len(cols)==2:
        for r in rows:
            for c in cols: cells.append((c[0],r[0],c[1]+1,r[1]+1))
        layout='2x2'
    elif len(rows)==1 and len(cols)>=n:
        cs = sorted(sorted(cols, key=lambda g:-(g[1]-g[0]))[:n])
        for c in cs: cells.append((c[0], rows[0][0], c[1]+1, rows[0][1]+1))
        layout='1x%d'%n
    else:
        return None, 'rows=%d cols=%d'%(len(rows),len(cols))
    os.makedirs(outdir, exist_ok=True)
    done=[]
    for (x0,y0,x1,y1),k in zip(cells, keys):
        pad = int(min(x1-x0, y1-y0)*0.04)
        cell = despeck(keyed.crop((max(0,x0-pad), max(0,y0-pad), min(W,x1+pad), min(H,y1+pad))))
        r = norm_center(cell)
        if r is None: continue
        r.save(os.path.join(outdir, k+'.webp'), 'WEBP', quality=92, method=6)
        done.append(k)
    return done, layout


def norm_tight(im, H=192):
    """착용 레이어용 : 여백 없이 bbox 만 남기고 높이를 H 로 맞춘다(가로는 비율 유지).
       ★ 정사각 프레임에 '꽉 채우기'로 저장하면 옷마다 크기가 제각각이 된다.
          여기서는 bbox 자체가 의미를 갖는다 — 위=어깨선, 아래=허리선, 폭=어깨너비.
          그래야 캐릭터의 어깨~허리에 그대로 얹어 모든 장비가 같은 자리에 온다."""
    bb = im.getbbox()
    if not bb: return None
    im = im.crop(bb); w,h = im.size
    if w<24 or h<24: return None
    nw = max(1, int(round(w*H/float(h))))
    return im.resize((nw,H), Image.LANCZOS)

def gear_split_tight(path, keys, outdir='art', top_frac=1.0, H=192):
    im = Image.open(path).convert('RGBA')
    W,Hh = im.size
    if top_frac < 1.0:
        im = im.crop((0,0,W,int(Hh*top_frac))); W,Hh = im.size
    keyed = key_white(im)
    a = np.array(keyed); mask = a[:,:,3] > 24
    mask = degrid(mask); a[~mask,3] = 0
    keyed = Image.fromarray(a,'RGBA')
    rows = _bands(mask.sum(axis=1)/float(W), 0.004, int(Hh*0.04))
    cols = _bands(mask.sum(axis=0)/float(Hh), 0.004, int(W*0.02))
    n = len(keys); cells=[]
    if len(rows)==2 and len(cols)==2:
        for r in rows:
            for c in cols: cells.append((c[0],r[0],c[1]+1,r[1]+1))
        layout='2x2'
    elif len(rows)==1 and len(cols)>=n:
        cs = sorted(sorted(cols, key=lambda g:-(g[1]-g[0]))[:n])
        for c in cs: cells.append((c[0], rows[0][0], c[1]+1, rows[0][1]+1))
        layout='1x%d'%n
    elif len(rows)==2 and len(cols)>=2 and n==4:
        cs = sorted(sorted(cols, key=lambda g:-(g[1]-g[0]))[:2])
        for r in rows:
            for c in cs: cells.append((c[0],r[0],c[1]+1,r[1]+1))
        layout='2x2(pruned)'
    else:
        return None, 'rows=%d cols=%d'%(len(rows),len(cols))
    os.makedirs(outdir, exist_ok=True)
    done=[]
    for (x0,y0,x1,y1),k in zip(cells, keys):
        pad = int(min(x1-x0, y1-y0)*0.04)
        cell = despeck(keyed.crop((max(0,x0-pad), max(0,y0-pad), min(W,x1+pad), min(Hh,y1+pad))))
        r = norm_tight(cell, H)
        if r is None: continue
        r.save(os.path.join(outdir, k+'.webp'), 'WEBP', quality=92, method=6)
        done.append(k)
    return done, layout
