#!/usr/bin/env python3
"""그림이 아직 없는 종을, 같은 골격의 그림을 색만 돌려서 채운다.
   같은 골격을 쓰므로 형태는 맞고, 숲마다 색이 달라 다른 종으로 읽힌다.
   원본 그림이 도착하면 그때 덮어쓴다."""
import json, os, glob, colorsys
from PIL import Image
import numpy as np

L = json.load(open('species.json'))
BY = {s['k']: s for s in L}

def hex2hue(h):
    h = h.lstrip('#')
    r,g,b = (int(h[i:i+2],16)/255 for i in (0,2,4))
    return colorsys.rgb_to_hsv(r,g,b)[0]

def dom_hue(im):
    a = np.array(im.convert('RGBA'))
    m = a[:,:,3] > 128
    if m.sum() == 0: return 0.0
    rgb = a[:,:,:3][m].astype(np.float32)/255
    mx = rgb.max(axis=1); mn = rgb.min(axis=1)
    sat = np.where(mx>0, (mx-mn)/np.maximum(mx,1e-6), 0)
    sel = sat > 0.22
    if sel.sum() < 20: sel = sat > 0.08
    if sel.sum() == 0: return 0.0
    px = rgb[sel]
    hs = np.array([colorsys.rgb_to_hsv(*p)[0] for p in px[::max(1,len(px)//600)]])
    ang = np.exp(2j*np.pi*hs).mean()
    return (np.angle(ang)/(2*np.pi)) % 1.0

def shift(im, d):
    a = np.array(im.convert('RGBA')).astype(np.float32)
    rgb = a[:,:,:3]/255.0
    mx = rgb.max(axis=2); mn = rgb.min(axis=2); v = mx
    s = np.where(mx>0, (mx-mn)/np.maximum(mx,1e-6), 0)
    # RGB -> H
    r,g,b = rgb[:,:,0], rgb[:,:,1], rgb[:,:,2]
    dmax = mx-mn
    h = np.zeros_like(mx)
    nz = dmax>1e-6
    idx = nz & (mx==r); h[idx] = ((g-b)[idx]/dmax[idx]) % 6
    idx = nz & (mx==g); h[idx] = ((b-r)[idx]/dmax[idx]) + 2
    idx = nz & (mx==b); h[idx] = ((r-g)[idx]/dmax[idx]) + 4
    h = (h/6.0 + d) % 1.0
    # H -> RGB
    i = np.floor(h*6).astype(int) % 6
    f = h*6 - np.floor(h*6)
    p = v*(1-s); q = v*(1-f*s); t = v*(1-(1-f)*s)
    out = np.zeros_like(rgb)
    for k,(R,G,B) in enumerate([(v,t,p),(q,v,p),(p,v,t),(p,q,v),(t,p,v),(v,p,q)]):
        m = i==k
        out[:,:,0][m]=R[m]; out[:,:,1][m]=G[m]; out[:,:,2][m]=B[m]
    a[:,:,:3] = np.clip(out*255,0,255)
    return Image.fromarray(a.astype(np.uint8),'RGBA')

if __name__=='__main__':
    have = {os.path.splitext(os.path.basename(f))[0] for f in glob.glob('art/*.webp')}
    # 골격별로 쓸 수 있는 원본 그림 목록
    pool = {}
    for k in have:
        s = BY.get(k)
        if s: pool.setdefault(s['plan'], []).append(k)
    cache = {}
    made = 0
    for s in L:
        k = s['k']
        if k in have: continue
        cand = pool.get(s['plan'])
        if not cand:
            print('  골격 원본 없음:', k, s['plan']); continue
        src = cand[hash(k) % len(cand)]
        if src not in cache:
            im = Image.open('art/%s.webp'%src).convert('RGBA')
            cache[src] = (im, dom_hue(im))
        im, sh = cache[src]
        d = (hex2hue(s['body']) - sh) % 1.0
        shift(im, d).save('art/%s.webp'%k, 'WEBP', quality=90, method=6)
        made += 1
    print('색 변형으로 채운 종: %d · 원본: %d · 합계 %d' % (made, len(have), made+len(have)))
