# -*- coding: utf-8 -*-
"""무기 그림에서 '손잡이 자리'를 자동으로 뽑는다.  (원리 ②)

   왜 필요한가 :
     지금까지 무기 48종의 쥐는 좌표를 손으로 하나씩 박아 넣었다(W_GRIP 48줄).
     규칙이 아니라 48개의 예외였고, 그래서 하나 고치면 하나가 틀어졌다.
     상용 에셋팩(Mana Seed)이 "모든 시트가 완전히 같은 배치라서 겹치면 딱 맞는다"
     고 못 박는 그 규격을, 우리는 그림에서 직접 계산해서 만든다.

   방법 (전부 그림에서 잰다 — 짐작 없음) :
     1) 실루엣의 주축(가장 긴 방향)을 주성분분석으로 구한다        → 자루 방향
     2) 주축에 투영해 양 끝을 찾고, 양 끝의 '단면 두께'를 잰다
        얇은 쪽이 손잡이다 (날·머리·추는 언제나 두껍다)
     3) 쥐는 점 = 손잡이 끝에서 전체 길이의 일정 비율만큼 들어간 자리
        레퍼런스 실측 : 검 0.263 · 지팡이 0.409
        길이비가 낮은(뭉툭한) 물건은 손잡이가 없으므로 무게중심을 쥔다
"""
from PIL import Image
import numpy as np, json, glob, os, math

def solve(path):
    a=np.array(Image.open(path).convert('RGBA'))
    H,W=a.shape[:2]
    m=a[:,:,3]>60
    ys,xs=np.where(m)
    if len(xs)<20: return None
    P=np.stack([xs.astype(float), ys.astype(float)],1)
    c=P.mean(0)
    Q=P-c
    cov=(Q.T@Q)/len(Q)
    ev,evec=np.linalg.eigh(cov)
    ax=evec[:,np.argmax(ev)]                    # 주축 (단위벡터)
    perp=np.array([-ax[1], ax[0]])
    t=Q@ax; u=Q@perp
    t0,t1=t.min(),t.max(); L=t1-t0
    wid=(u.max()-u.min())
    slim = L/max(1.0,wid)                        # 길쭉한 정도

    # ── 주축을 따라 '두께 단면도'를 낸다 (20칸) ────────────────
    NB=20
    prof=np.zeros(NB)
    for b in range(NB):
        lo=t0+L*b/NB; hi=t0+L*(b+1)/NB
        sel=(t>=lo)&(t<=hi)
        prof[b]= 0.0 if sel.sum()<4 else float(np.percentile(u[sel],95)-np.percentile(u[sel],5))
    mx=prof.max() if prof.max()>0 else 1.0

    # ── 어느 쪽 끝이 손잡이인가 ────────────────────────────────────
    #   ★ '얇은 쪽이 손잡이'는 틀렸다. 칼끝도 얇다(실제로 칼날을 손잡이로 잡았다).
    #   진짜 차이는 '끝이 뾰족하게 좁아지는가'다.
    #     · 날 끝  : 끝으로 갈수록 급히 좁아진다      → 맨끝/안쪽 비율이 작다
    #     · 손잡이 : 굵기가 거의 일정하고 자루끝에 뭉치(폼멜)가 있다 → 비율이 1 이상
    def flatness(p):
        near=float(np.mean(p[1:4])) if len(p)>=4 else float(p[0])
        return (float(p[0])/near) if near>1e-6 else 0.0
    fA=flatness(prof)          # t 작은 쪽
    fB=flatness(prof[::-1])    # t 큰 쪽
    thA=float(prof[:3].mean()); thB=float(prof[-3:].mean())
    hasGrip = max(thA,thB) > 1e-6
    if abs(fA-fB) > 0.12:
        buttIsA = fA > fB                    # 덜 뾰족한 쪽이 손잡이
    else:
        buttIsA = thA <= thB                 # 비슷하면 얇은 쪽
    if buttIsA: butt,tip,order = t0,t1,+1
    else:       butt,tip,order = t1,t0,-1
    d = 1.0 if tip>butt else -1.0
    # 손잡이가 아예 없는 뭉툭한 물건 판정 : 양 끝 두께가 비슷하고 전체가 짧다
    if (min(thA,thB)/max(thA,thB,1e-6)) > 0.72 and slim < 2.4:
        hasGrip=False

    if not hasGrip:
        gt = 0.0; frac=None                       # 뭉툭한 물건 — 무게중심을 쥔다
    else:
        # 손잡이(얇은 구간)가 전체의 몇 %인지 재서 계열을 가른다
        pr = prof if order>0 else prof[::-1]
        thin=0
        for v in pr:
            if v <= mx*0.62: thin+=1
            else: break
        shaft = thin/float(NB)
        frac = 0.409 if shaft > 0.50 else 0.263   # 장병기·지팡이 / 검 계열 (레퍼런스 실측값)
        gt = butt + d*L*frac

    g = c + ax*gt
    ang = math.atan2(ax[1]*d, ax[0]*d)           # 손잡이에서 끝을 향하는 방향
    return dict(gx=round(float(g[0])/W,4), gy=round(float(g[1])/H,4),
                ang=round(float(ang),4),
                len=round(float(L)/W,4), wid=round(float(wid)/W,4),
                slim=round(float(slim),3),
                frac=(None if frac is None else frac))

if __name__=='__main__':
    out={}
    for p in sorted(glob.glob('art/eq_*.webp')):
        k=os.path.basename(p)[:-5]
        r=solve(p)
        if r: out[k]=r
    json.dump(out, open('art/wep_grip.json','w'), indent=1)
    print('무기 %d종 손잡이 자동 검출'%len(out))
    for k in list(out)[:10]:
        r=out[k]
        print('  %-14s 쥐는점(%.3f,%.3f) 각도 %+.2f rad  길이/폭 %.2f  비율 %s'%(
            k,r['gx'],r['gy'],r['ang'],r['slim'],r['frac']))
