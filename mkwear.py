#!/usr/bin/env python3
"""장비를 '캐릭터와 같은 192x192 캔버스에 이미 착용된 상태'로 구워낸다.
   벤치마킹 근거 :
     · 2D Pixel Quest — "베이스 캐릭터와 같은 크기의 투명 PNG로 제공되어 그냥 겹치면 된다"
     · Mana Seed     — "모든 레이어가 완전히 같은 배치라서 겹치면 딱 맞는다"
     · GameDev.net   — "중앙정렬·크기보정·리사이즈는 답이 아니다"
   게임은 계산 없이 drawImage(layer,0,0) 로 겹치기만 한다.
   좌표는 전부 게임 캔버스에 격자를 씌워 눈으로 읽은 실측값이다."""
from PIL import Image
import os, sys
S=192
# ══════════════════════════════════════════════════════════════════
# 2026-08-31 재실측: 기존 HEAD box(cx=.4325,cy=.480,w=.285,h=.300)는
# 실제 몸 그림(heroW_*)의 머리 위치와 전혀 안 맞았다(모자가 코 위에 얹힘).
# heroW_* 6종을 픽셀로 실측(눈동자 중심·이마 정수리·귀 끝)해서 다시 잡았고,
# 갑옷 미착용 상태(hero_idle 등, HEAD_OVERLAY가 적용되는 또 다른 캔버스 —
# 얼굴이 캔버스 대부분을 채우는 완전히 다른 구도)용 박스를 별도로 추가했다.
# 두 세트 모두 art/*.webp를 직접 픽셀 스캔해서 얻은 실측값이며, 최종 위치는
# Python으로 합성 미리보기를 반복 렌더링해 육안 확인 후 확정했다(추측 금지).
# ══════════════════════════════════════════════════════════════════
HEAD=dict(cx=0.485, cy=0.22, w=0.46, h=0.42)        # heroW_* (갑옷 착용) 기준
HEAD_BARE=dict(cx=0.43, cy=0.226, w=0.46, h=0.42)   # hero_idle 등 (갑옷 미착용) 기준
BODY=dict(cx=0.435,  cy=0.720, w=0.300, h=0.260)   # 몸통    (실측 x0.29~0.59  y0.59~0.85)
FEET=dict(cx=0.443,  cy=0.927, w=0.265, h=0.130)   # 발바닥선 y=0.927 (실측), 발 폭 x0.318~0.568

HEAD_SPEC={'cap':('eq_cap',0.85,0.06), 'helm':('eq_helm',2.05,0.42),
           'horn':('eq_horn',2.05,0.42), 'hood':('eq_hood',1.50,0.38),
           'mask':('eq_mask',0.95,0.62), 'crown':('eq_crown',0.85,0.03)}
HEAD_SPEC_BARE={'cap':('eq_cap',0.85,0.06), 'helm':('eq_helm',2.05,0.42),
           'horn':('eq_horn',2.05,0.42), 'hood':('eq_hood',1.55,0.36),
           'mask':('eq_mask',0.95,0.62), 'crown':('eq_crown',0.85,0.03)}
#  ★ 망토·신발 레이어는 폐기 (A/B 비교 결과 갑옷을 가려 6종 구분이 안 됨)
#     신발·장갑은 갑옷 전신 그림에 이미 그려져 있다.
_CAPE_SPEC_UNUSED={'cape':('eq_cape',1.60,0.55)}           # 몸보다 넓게 = 양옆으로 보인다
# 신발은 '한 켤레 상품 사진'을 통째로 붙이면 다리 앞에 덮어둔 것처럼 보인다.
# 두 짝으로 잘라 다리마다 하나씩 신긴다. 다리 위치는 6종 갑옷에서 모두 같게 실측됨:
#   발목 y=0.90 기준 왼발 중심 0.373 · 오른발 중심 0.523 · 발바닥 y=0.927
LEGS=[0.373, 0.523]
LEG_W=0.115      # 다리 폭 0.085 보다 조금 넓게 = 감싸 신은 느낌
FOOT_BOTTOM=0.930

def place(key, box, scale, vpos):
    """vpos=None 이면 box['cy'] 를 '밑선'으로 보고 아래를 맞춘다(신발용)."""
    src=Image.open('art/%s.webp'%key).convert('RGBA')
    ic=src.crop(src.getbbox())
    bw=box['w']*S; bh=box['h']*S
    bx0=(box['cx']-box['w']/2)*S; by0=(box['cy']-box['h']/2)*S
    tw=bw*scale; th=ic.height*tw/ic.width
    r=ic.resize((max(1,round(tw)), max(1,round(th))), Image.LANCZOS)
    out=Image.new('RGBA',(S,S),(0,0,0,0))
    px=round(box['cx']*S - r.width/2)
    py=round(box['cy']*S - r.height) if vpos is None else round(by0+bh*vpos-r.height/2)
    out.paste(r,(px,py),r)
    return out

def boots_layer():
    """한 켤레 그림을 좌우로 잘라 다리마다 한 짝씩 신긴다."""
    src=Image.open('art/eq_boots.webp').convert('RGBA')
    ic=src.crop(src.getbbox())
    half=ic.width//2
    left=ic.crop((0,0,half,ic.height)); left=left.crop(left.getbbox())
    right=ic.crop((half,0,ic.width,ic.height)); right=right.crop(right.getbbox())
    out=Image.new('RGBA',(S,S),(0,0,0,0))
    for cx,piece in zip(LEGS,[left,right]):
        tw=LEG_W*S
        th=piece.height*tw/piece.width
        r=piece.resize((max(1,round(tw)), max(1,round(th))), Image.LANCZOS)
        out.paste(r,(round(cx*S-r.width/2), round(FOOT_BOTTOM*S-r.height)), r)
    return out

def build(outdir='art'):
    made=[]
    for n,(k,s,v) in HEAD_SPEC.items():
        p=os.path.join(outdir,'hw_%s.webp'%n); place(k,HEAD,s,v).save(p,'WEBP',quality=92,method=6)
        made.append(('hw_'+n,os.path.getsize(p)))
    for n,(k,s,v) in HEAD_SPEC_BARE.items():
        p=os.path.join(outdir,'hwbare_%s.webp'%n); place(k,HEAD_BARE,s,v).save(p,'WEBP',quality=92,method=6)
        made.append(('hwbare_'+n,os.path.getsize(p)))
    for n,(k,s,v) in {}.items():
        p=os.path.join(outdir,'bw_%s.webp'%n); place(k,BODY,s,v).save(p,'WEBP',quality=92,method=6)
        made.append(('bw_'+n,os.path.getsize(p)))
    return made
if __name__=='__main__':
    for n,b in build(sys.argv[1] if len(sys.argv)>1 else 'art'): print('%-10s %d bytes'%(n,b))
