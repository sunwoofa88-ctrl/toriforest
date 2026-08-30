# -*- coding: utf-8 -*-
"""손 그림에서 '자루를 감싸는 손가락'만 남기고 손바닥·손목을 잘라 낸다.
   Spine 의 hand_front 슬롯은 자루 앞을 덮는 손가락만이다. 손바닥·손목까지 얹으면
   그게 몸통 위에 크림색 덩어리로 붙는다(실제 렌더로 확인).
   봉 중심은 자를 때 그림 정중앙(=OUT_PX/2)에 있었다 — 그 오른쪽만 버린다."""
from PIL import Image
import numpy as np, json, os

META = json.load(open('art/hand_meta.json'))
out  = {}
for key, m in META.items():
    p = 'art/%s.webp' % key
    im = Image.open(p).convert('RGBA')
    a  = np.array(im); H, W = a.shape[:2]
    al = a[:,:,3] > 60
    xs = np.where(al.any(0))[0]; ys = np.where(al.any(1))[0]
    L, R, T, B = xs[0], xs[-1], ys[0], ys[-1]
    rodC = W * 0.5
    rodHalf = m['rodW'] * W * 0.5
    cut = int(round(rodC + rodHalf + W*0.012))       # 봉 오른쪽 끝 + 아주 조금
    cut = min(cut, R)
    sub = a[T:B+1, L:cut+1].copy()
    sub[:, :, 3] = np.where(al[T:B+1, L:cut+1], sub[:, :, 3], 0)
    h, w = sub.shape[:2]
    img = Image.fromarray(sub, 'RGBA')
    img.save(p, 'WEBP', quality=95, method=6)
    # 자루가 지나가는 선 = 잘라 낸 그림의 오른쪽 끝 근처(봉 중심)
    gx = (rodC - L) / w
    gy = 0.5
    out[key] = dict(gx=round(float(gx),4), gy=gy,
                    w=int(w), h=int(h),
                    ar=round(float(w)/h,4),          # 가로/세로
                    rodW=round(float(m['rodW']*W)/w,4))
    print('%-12s  %dx%d → %dx%d   자루선 x=%.3f'%(key,W,H,w,h,gx))
json.dump(out, open('art/hand_meta.json','w'), indent=1)
