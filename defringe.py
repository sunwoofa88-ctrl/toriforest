# -*- coding: utf-8 -*-
"""가장자리에 남은 흰 테두리(글로우 때문에 배경 판정이 안 된 부분) 제거.
   '거의 흰색이고 투명과 맞닿은' 픽셀을 바깥에서부터 벗겨 낸다."""
from PIL import Image
import numpy as np, sys, glob, os
def strip(path, thr=232, rounds=4):
    im=Image.open(path).convert('RGBA'); a=np.array(im).astype(int)
    A=a[:,:,3]>40
    changed=0
    for _ in range(rounds):
        lum=(a[:,:,0]*0.3+a[:,:,1]*0.59+a[:,:,2]*0.11)
        # 투명과 맞닿은 픽셀
        edge=np.zeros_like(A)
        edge[1:,:]  |= A[1:,:]  & ~A[:-1,:]
        edge[:-1,:] |= A[:-1,:] & ~A[1:,:]
        edge[:,1:]  |= A[:,1:]  & ~A[:,:-1]
        edge[:,:-1] |= A[:,:-1] & ~A[:,1:]
        kill = edge & A & (lum>thr)
        n=int(kill.sum())
        if n==0: break
        a[kill,3]=0; A=a[:,:,3]>40; changed+=n
    if changed:
        Image.fromarray(a.astype(np.uint8),'RGBA').save(path,'WEBP',quality=92,method=6)
    return changed
if __name__=='__main__':
    tot=0; n=0
    for p in sys.argv[1:]:
        c=strip(p)
        if c: n+=1; tot+=c
    print('%d장에서 흰 테두리 %d픽셀 제거'%(n,tot))
