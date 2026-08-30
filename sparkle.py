#!/usr/bin/env python3
"""눈을 더 '초롱초롱'하게 — 큰 하이라이트 + 작은 보조 하이라이트 + 아래쪽 반사광.
   눈 위치·크기는 자동 검출(어두운 둥근 덩어리 2개)해서 쓰므로 그림마다 따로 맞출 필요가 없다."""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

def eye_blobs(im):
    a=np.array(im.convert('RGBA')).astype(np.float32); al=a[:,:,3]>40
    lum=(a[:,:,0]*0.3+a[:,:,1]*0.59+a[:,:,2]*0.11)/255.0
    H,W=lum.shape
    dark=(lum<0.28)&al; dark[int(H*0.55):,:]=False
    lab,n=ndimage.label(dark)
    objs=[]
    for i in range(1,n+1):
        ys,xs=np.nonzero(lab==i); ar=len(ys)
        if ar<(H*W)*0.0008: continue
        h=ys.max()-ys.min()+1; w=xs.max()-xs.min()+1
        if w==0 or h==0: continue
        r=w/float(h)
        if r<0.45 or r>2.2: continue
        objs.append({'a':ar,'x':xs.mean(),'y':ys.mean(),'w':w,'h':h,
                     'x0':xs.min(),'x1':xs.max(),'y0':ys.min(),'y1':ys.max()})
    objs.sort(key=lambda o:-o['a']); cand=objs[:4]; best=None
    for i in range(len(cand)):
        for j in range(i+1,len(cand)):
            A,B=cand[i],cand[j]
            dy=abs(A['y']-B['y']); dx=abs(A['x']-B['x'])
            if dx<8 or dy>dx*0.45: continue
            if min(A['a'],B['a'])/max(A['a'],B['a'])<0.45: continue
            sc=(A['a']+B['a'])-dy*30
            if best is None or sc>best[0]: best=(sc,A,B)
    if not best: return None
    _,A,B=best
    return (A,B) if A['x']<B['x'] else (B,A)

def sparkle(path, out=None):
    im=Image.open(path).convert('RGBA')
    r=eye_blobs(im)
    if not r: return None
    lay=Image.new('RGBA', im.size, (0,0,0,0))
    d=ImageDraw.Draw(lay)
    for E in r:
        cx,cy=E['x'],E['y']; rw=E['w']/2.0; rh=E['h']/2.0
        # ① 큰 하이라이트 (왼쪽 위)
        hx,hy = cx-rw*0.34, cy-rh*0.36
        hr = rw*0.40
        d.ellipse([hx-hr,hy-hr*1.05,hx+hr,hy+hr*1.05], fill=(255,255,255,255))
        # ② 작은 하이라이트 (오른쪽 위)
        sx,sy = cx+rw*0.36, cy-rh*0.44
        sr = rw*0.17
        d.ellipse([sx-sr,sy-sr,sx+sr,sy+sr], fill=(255,255,255,235))
        # ③ 아래쪽 반사광 (초롱초롱함의 핵심)
        bx,by = cx+rw*0.02, cy+rh*0.44
        bw,bh = rw*0.46, rh*0.24
        d.ellipse([bx-bw,by-bh,bx+bw,by+bh], fill=(255,255,255,150))
    # 눈(어두운 부분) 안쪽에만 남긴다
    a=np.array(im).astype(np.float32)
    lum=(a[:,:,0]*0.3+a[:,:,1]*0.59+a[:,:,2]*0.11)/255.0
    inside=((lum<0.42)&(a[:,:,3]>40)).astype(np.float32)
    inside=ndimage.gaussian_filter(inside, 0.6)
    la=np.array(lay).astype(np.float32); la[:,:,3]*=np.clip(inside,0,1)
    out_im=im.copy()
    out_im.alpha_composite(Image.fromarray(np.clip(la,0,255).astype(np.uint8),'RGBA'))
    out_im.save(out or path,'WEBP',quality=94,method=6)
    return {'eyes':[(round(E['x']),round(E['y']),E['w'],E['h']) for E in r]}

if __name__=='__main__':
    import os,sys
    os.chdir('/root/toriforest')
    ks=sys.argv[1:] or ['hero_idle','hero_blink','hero_atk','hero_hurt','hero_inhale','hero_move',
                        'heroW_light','heroW_plate','heroW_mage','heroW_scale','heroW_royal']
    for k in ks:
        p='art/%s.webp'%k
        if not os.path.exists(p): print(k,'없음'); continue
        print(k, sparkle(p))
