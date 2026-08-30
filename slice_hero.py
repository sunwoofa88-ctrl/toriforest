# -*- coding: utf-8 -*-
"""갑옷 주인공 시트(마젠타 봉을 쥔 다람쥐 3마리) → heroW_*.webp + 파지 좌표.

   왜 이렇게 하나 :
     갑옷 그림 6종이 '두 팔을 내린' 자세로 그려져 있었다. 맨몸 그림만 주먹을 들고 있었다.
     그래서 손 좌표가 가슴팍에 찍히고 손·무기가 엉뚱한 데 붙었다(S22+ 화면에서 확인).
     참고로 받은 상용 2D 스프라이트 시트 7종은 전부 '그 무기를 드는 자세로 팔이 그려져'
     있다 — 고정된 주먹에 무기를 갖다 붙인 건 하나도 없다.
   마젠타 봉이 자(ruler)다. 봉을 지우면 쥐는 점·자루 각도·굵기가 그림에서 그대로 나온다."""
from PIL import Image
import numpy as np, json, sys, os
from collections import deque

def runs0(mask,H,W):
    cols=mask.sum(0); out=[];cur=None
    for x in range(W):
        if cols[x]>H*0.05: cur=[x,x] if cur is None else [cur[0],x]
        elif cur: out.append(cur); cur=None
    if cur: out.append(cur)
    return out

BASE_F = 112/120.0
OUT    = 192

def cut(src, keys, meta_out):
    im=Image.open(src).convert('RGB'); a=np.array(im).astype(int); H,W,_=a.shape
    R,G,B=a[:,:,0],a[:,:,1],a[:,:,2]
    magcore=(R>110)&(B>110)&((R-G)>45)&((B-G)>45)   # 진짜 봉 (측정용)
    mag=magcore.copy()
    # 봉 가장자리의 흐린 분홍/연보라 잔티까지 잡는다 — 안 그러면 세로 띠가 남는다
    soft=(R>150)&(B>150)&((R-G)>16)&((B-G)>16)
    grow=mag.copy()
    for _ in range(3):
        g2=grow.copy()
        g2[1:,:]|=grow[:-1,:]; g2[:-1,:]|=grow[1:,:]
        g2[:,1:]|=grow[:,:-1]; g2[:,:-1]|=grow[:,1:]
        grow=g2
    mag = mag | (grow & soft)
    # 봉 둘레의 '연보라 후광'은 흰색 판정에도 안 걸리고 마젠타에도 안 걸린다.
    #   크림색 얼굴(R>G>B)과 달리 후광은 파랑이 빨강 이상(B>=R)이다 — 그걸로 가른다.
    #   봉의 x 띠 안에서만 적용해 얼굴·배를 건드리지 않는다.
    pale=(R>196)&(G>190)&(B>200)&(B>=R)
    band=np.zeros((H,W),bool)
    for _r in runs0(magcore,H,W):
        band[:, max(0,_r[0]-14):min(W,_r[1]+15)]=True
    mag = mag | (band & pale)
    wht=(R>236)&(G>236)&(B>236)
    # 가장자리에서 흘러온 흰색만 배경
    bg=np.zeros((H,W),bool); q=deque()
    for x in range(W):
        for y in (0,H-1):
            if wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if wht[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
    while q:
        cy,cx=q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=cy+dy,cx+dx
            if 0<=ny<H and 0<=nx<W and wht[ny,nx] and not bg[ny,nx]:
                bg[ny,nx]=True; q.append((ny,nx))
    fg = ~bg & ~mag                      # 캐릭터(봉 제외)

    # 마젠타 기둥으로 칸을 나눈다 — 각 캐릭터마다 봉이 하나씩 있다
    cols=magcore.sum(0); runs=[];cur=None
    for x in range(W):
        if cols[x]>H*0.05: cur=[x,x] if cur is None else [cur[0],x]
        elif cur: runs.append(cur); cur=None
    if cur: runs.append(cur)
    assert len(runs)==len(keys), '마젠타 봉 %d개 (기대 %d)'%(len(runs),len(keys))

    centers=[(r[0]+r[1])/2.0 for r in runs]
    # ★ 칸은 '봉 간격'이 아니라 '캐릭터 덩어리'로 나눈다.
    #    봉이 캐릭터 왼쪽에 치우쳐 있어서 간격으로 자르면 옆 캐릭터를 물어 온다(실제로 그랬다).
    #    캐릭터(봉 제외) 세로투영의 빈 구간을 경계로 삼는다.
    colf=fg.sum(0); thr=H*0.01
    cr=[];cur=None
    for x in range(W):
        if colf[x]>thr: cur=[x,x] if cur is None else [cur[0],x]
        elif cur:
            if cur[1]-cur[0]>W*0.05: cr.append(cur)
            cur=None
    if cur and cur[1]-cur[0]>W*0.05: cr.append(cur)
    # 봉과 캐릭터가 붙어 한 덩어리면 그대로, 아니면 가까운 것끼리 합친다
    mg=[]
    for r in cr:
        if mg and r[0]-mg[-1][1] < W*0.03: mg[-1][1]=r[1]
        else: mg.append(list(r))
    if len(mg)!=len(keys):
        step=W//len(keys); mg=[[i*step,(i+1)*step-1] for i in range(len(keys))]
        print('  ! 캐릭터 덩어리 %d개 — 균등 분할로 대체'%len(cr))
    meta={}
    for i,(key,rr) in enumerate(zip(keys,runs)):
        x0=max(0,mg[i][0]-4); x1=min(W,mg[i][1]+5)
        sub=fg[:, x0:x1]; subm=mag[:, x0:x1]; submc=magcore[:, x0:x1]; suba=a[:, x0:x1]
        ys=np.where(sub.any(1))[0]; xs=np.where(sub.any(0))[0]
        if len(ys)==0: print('  ! %s 빈 칸'%key); continue
        by0,by1,bx0,bx1=ys[0],ys[-1],xs[0],xs[-1]
        bw=bx1-bx0+1; bh=by1-by0+1

        # 쥐는 점 : 봉의 중심축 x, 손가락이 봉을 가린 구간의 세로 중심
        rcx=(rr[0]+rr[1])/2.0 - x0
        band=submc[:, max(0,int(rcx-(rr[1]-rr[0])*0.5)):int(rcx+(rr[1]-rr[0])*0.5)+1]
        rows=band.any(1)
        top=int(np.argmax(rows)); bot=len(rows)-1-int(np.argmax(rows[::-1]))
        gap=[y for y in range(top,bot+1) if not rows[y]]
        if gap: gy0,gy1=gap[0],gap[-1]
        else:   gy0=gy1=(top+bot)//2
        gcy=(gy0+gy1)/2.0
        rodw=(rr[1]-rr[0]+1)
        fisth=max(gy1-gy0+1, rodw*1.6)      # 손가락이 봉을 가린 세로 길이 = 주먹 높이(실측)

        # ── 봉이 캐릭터(꼬리·몸)를 관통한 자리를 메운다 ─────────────
        #   봉을 지우면 꼬리에 세로 슬롯이 남는다. 양옆이 모두 캐릭터인 구멍은
        #   좌우 가장 가까운 화소로 채운다(표준 홀 필링). 평면 셀 채색이라 티가 안 난다.
        sm = subm.copy()
        for yy in range(sm.shape[0]):
            xs2=np.where(sm[yy])[0]
            if len(xs2)==0: continue
            for xx in xs2:
                lx=xx-1
                while lx>=0 and sm[yy,lx]: lx-=1
                rx=xx+1
                while rx<sm.shape[1] and sm[yy,rx]: rx+=1
                # ★ 구멍 바로 옆 3px 은 봉의 후광이 물든 자리다. 그대로 퍼오면
                #    꼬리에 창백한 띠가 남는다(실제로 남았다). 더 안쪽에서 뜬다.
                lx-=3; rx+=3
                if lx<0 or rx>=sm.shape[1]: continue
                if lx>=0 and rx<sm.shape[1] and sub[yy,lx] and sub[yy,rx] and (rx-lx)<40 \
                   and abs(int(suba[yy,lx,0])-int(suba[yy,rx,0]))<70 \
                   and abs(int(suba[yy,lx,1])-int(suba[yy,rx,1]))<70 \
                   and abs(int(suba[yy,lx,2])-int(suba[yy,rx,2]))<70:
                    t=(xx-lx)/float(rx-lx)
                    suba[yy, xx] = suba[yy,lx]*(1-t) + suba[yy,rx]*t
                    sub[yy,xx]=True

        # ── AI 가 그려 넣은 바닥 그림자(흰 타원) 제거 ────────────────
        #   'no ground shadow' 라고 해도 자꾸 그린다. 발밑 15% 구간의 거의 흰
        #   화소만 지운다 — 크림색 얼굴(238 미만)은 건드리지 않는다.
        yb=int(sub.shape[0]*0.82)
        nearw=(suba[:,:,0]>230)&(suba[:,:,1]>230)&(suba[:,:,2]>230)
        sub[yb:,:] = sub[yb:,:] & ~nearw[yb:,:]

        ys=np.where(sub.any(1))[0]; xs=np.where(sub.any(0))[0]
        by0,by1,bx0,bx1=ys[0],ys[-1],xs[0],xs[-1]
        bw=bx1-bx0+1; bh=by1-by0+1

        # 출력 : 기존 그림과 같은 틀 (가로 가운데, 발밑이 BASE_F)
        scale = (OUT*0.917) / bh
        nw=int(round(bw*scale)); nh=int(round(bh*scale))
        canv=np.zeros((OUT,OUT,4),np.uint8)
        cell=np.zeros((bh,bw,4),np.uint8)
        for yy in range(bh):
            for xx in range(bw):
                if sub[by0+yy, bx0+xx]:
                    cell[yy,xx,0:3]=suba[by0+yy, bx0+xx]; cell[yy,xx,3]=255
        img=Image.fromarray(cell,'RGBA').resize((nw,nh), Image.LANCZOS)
        ox=(OUT-nw)//2; oy=int(round(OUT*BASE_F))-nh
        base=Image.fromarray(canv,'RGBA'); base.paste(img,(ox,oy),img)
        base.save('art/%s.webp'%key,'WEBP',quality=95,method=6)

        gx=(rcx-bx0)*scale+ox; gy=(gcy-by0)*scale+oy
        # ── 주먹의 실제 사각형을 잰다 ────────────────────────────────
        #   손가락이 봉을 가린 세로 구간(gy0..gy1) 안에서, 봉 축 둘레의
        #   캐릭터 화소가 가로로 어디까지 이어지는지 본다. 짐작이 없다.
        pad=int(fisth*0.35)
        ry0=max(0,int(gy0-pad)); ry1=min(sub.shape[0]-1,int(gy1+pad))
        cxs=[]
        for yy in range(ry0,ry1+1):
            xx=int(rcx)
            if xx<0 or xx>=sub.shape[1]: continue
            l=xx
            while l>0 and sub[yy,l-1]: l-=1
            r2=xx
            while r2<sub.shape[1]-1 and sub[yy,r2+1]: r2+=1
            cxs.append((l,r2))
        # 가로는 봉 축을 기준으로 주먹 높이만큼만 — 그 이상 넓히면 꼬리까지
        # 다시 그려져 무기를 가린다(실제로 가렸다).
        fx0=int(rcx-fisth*0.72); fx1=int(rcx+fisth*0.82)
        if cxs:
            l0=min(c[0] for c in cxs); r0=max(c[1] for c in cxs)
            fx0=max(fx0,l0); fx1=min(fx1,r0)
        FX0=(fx0-bx0)*scale+ox; FX1=(fx1-bx0)*scale+ox
        FY0=(ry0-by0)*scale+oy; FY1=(ry1-by0)*scale+oy
        meta[key]=dict(hx=round(gx/OUT-0.5,4), hy=round(gy/OUT-BASE_F,4),
                       d=round(fisth*scale/OUT,4),
                       fx0=round(FX0/OUT,4), fx1=round(FX1/OUT,4),
                       fy0=round(FY0/OUT,4), fy1=round(FY1/OUT,4))
        print('  %-14s %dx%d → %dpx  쥐는점 (%.4f, %.4f)  봉굵기 %d'%(
              key,bw,bh,OUT,meta[key]['hx'],meta[key]['hy'],rodw))
    old={}
    if os.path.exists(meta_out): old=json.load(open(meta_out))
    old.update(meta)
    json.dump(old, open(meta_out,'w'), indent=1)
    return meta

if __name__=='__main__':
    cut(sys.argv[1], sys.argv[2:], 'art/hero_grip.json')
