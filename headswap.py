#!/usr/bin/env python3
"""착용 전신그림에 '원래 주인공 얼굴'을 정확히 옮겨 붙인다.
   ── 두 눈을 자동으로 찾아(어두운 둥근 덩어리 2개) 눈 간격으로 크기를,
      눈 중점으로 위치를 맞춘 뒤, 목선 위(=얼굴)만 갈아 끼운다.
      AI 가 다시 그린 얼굴이 원본과 달라 보이는 문제를 이걸로 없앤다."""
import numpy as np
from PIL import Image
from scipy import ndimage

def find_eyes(im):
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
        objs.append((ar,xs.mean(),ys.mean()))
    objs.sort(key=lambda o:-o[0]); cand=objs[:4]; best=None
    for i in range(len(cand)):
        for j in range(i+1,len(cand)):
            A,B=cand[i],cand[j]
            dy=abs(A[2]-B[2]); dx=abs(A[1]-B[1])
            if dx<8 or dy>dx*0.45: continue
            if min(A[0],B[0])/max(A[0],B[0])<0.45: continue
            sc=(A[0]+B[0])-dy*30
            if best is None or sc>best[0]: best=(sc,A,B)
    if not best: return None
    _,A,B=best
    L,R=(A,B) if A[1]<B[1] else (B,A)
    D=float(np.hypot(R[1]-L[1],R[2]-L[2]))
    return {'D':D,'mx':(L[1]+R[1])/2.0,'my':(L[2]+R[2])/2.0}

def swap(face_path, body_path, out_path, cut=1.42, feather=3):
    fim=Image.open(face_path).convert('RGBA')
    bim=Image.open(body_path).convert('RGBA')
    fe=find_eyes(fim); be=find_eyes(bim)
    if not fe or not be: return None
    W,H=bim.size
    s=be['D']/fe['D']
    nw,nh=int(round(fim.size[0]*s)), int(round(fim.size[1]*s))
    f2=fim.resize((nw,nh), Image.LANCZOS)
    ox=int(round(be['mx']-fe['mx']*s)); oy=int(round(be['my']-fe['my']*s))
    lay=Image.new('RGBA',(W,H),(0,0,0,0))
    lay.paste(f2,(ox,oy),f2)
    # 목선 : 눈 아래 cut*D
    ny=int(round(be['my']+cut*be['D']))
    m=np.zeros((H,W),dtype=np.float32)
    m[:max(0,ny-feather),:]=1.0
    for k in range(feather*2):
        y=ny-feather+k
        if 0<=y<H: m[y,:]=max(0.0,1.0-k/float(feather*2))
    la=np.array(lay).astype(np.float32)
    la[:,:,3]*=m
    lay=Image.fromarray(np.clip(la,0,255).astype(np.uint8),'RGBA')
    out=bim.copy(); out.alpha_composite(lay)
    out.save(out_path,'WEBP',quality=94,method=6)
    return {'scale':round(s,3),'off':(ox,oy),'neck':ny}

if __name__=='__main__':
    import sys, os
    os.chdir('/root/toriforest')
    for k in ['heroW_light','heroW_plate','heroW_mage','heroW_scale','heroW_royal']:
        r=swap('art/hero_idle.webp','art/%s.webp'%k,'art/%s.webp'%k)
        print(k, r)
