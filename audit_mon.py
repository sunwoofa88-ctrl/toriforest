# -*- coding: utf-8 -*-
"""몬스터 그림 전수 검사 — 슬라이스 결함을 전부 잡는다.
   ① 가로로 떨어진 개체가 둘 이상  ② 세로로 떨어진 개체가 둘 이상
   ③ 개체가 캔버스를 너무 조금 채움(격자 시트를 통째로 저장한 경우 등)"""
from PIL import Image
import numpy as np, json, os, sys
d=json.load(open('/tmp/species.json'))['list']
def blobs(mask, axis, L, minfrac):
    proj = mask.sum(axis)
    thr = max(2, L*0.012)
    runs=[];cur=None
    for i,v in enumerate(proj):
        if v>thr: cur=[i,i] if cur is None else [cur[0],i]
        elif cur: runs.append(cur); cur=None
    if cur: runs.append(cur)
    m=[]
    for r in runs:
        if m and r[0]-m[-1][1] < len(proj)*0.04: m[-1][1]=r[1]
        else: m.append(list(r))
    return [r for r in m if (r[1]-r[0]+1) > len(proj)*minfrac]
bad=[]; ok=[]; missing=[]
for x in d:
    p='art/%s.webp'%x['k']
    if not os.path.exists(p): missing.append(x['k']); continue
    a=np.array(Image.open(p).convert('RGBA')); H,W=a.shape[:2]
    al=a[:,:,3]>50
    hx=blobs(al,0,H,0.14); vy=blobs(al,1,W,0.14)
    ys=np.where(al.any(1))[0]; xs=np.where(al.any(0))[0]
    fill = (len(ys)*len(xs))/(H*W) if len(ys) else 0
    why=[]
    if len(hx)>=2: why.append('가로 %d덩어리'%len(hx))
    if len(vy)>=2: why.append('세로 %d덩어리'%len(vy))
    if fill<0.16: why.append('너무 작음 %.2f'%fill)
    if why: bad.append((x['k'],x['n'],', '.join(why)))
    else: ok.append(x['k'])
print('정상 %d · 결함 %d · 없음 %d'%(len(ok),len(bad),len(missing)))
for k,n,w in bad: print('  %-12s %-16s %s'%(k,n,w))
json.dump({'bad':[b[0] for b in bad],'missing':missing}, open('/tmp/monwork.json','w'))
