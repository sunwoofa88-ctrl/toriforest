#!/usr/bin/env python3
"""투구를 '캐릭터와 같은 192x192 캔버스에 이미 씌워진 상태'로 구워낸다.
   (벤치마킹 : 2D Pixel Quest '베이스와 같은 크기의 투명 PNG' / Mana Seed '동일 배치')
   게임은 계산 없이 drawImage(layer,0,0) 로 겹치기만 한다."""
from PIL import Image
import os, sys
S=192
# 실측 머리 상자 (게임 캔버스 비율) : x 0.29~0.575, y 0.33~0.63
HEAD=dict(cx=0.4325, cy=0.480, w=0.285, h=0.300)
# 종류 : (원본키, 머리폭 대비 배율, 머리상자 안 세로 위치 0=위 1=아래)
SPEC={
 'cap'   :('eq_cap',   1.34, 0.10),
 'helm'  :('eq_helm',  1.34, 0.46),
 'horn'  :('eq_horn',  1.48, 0.30),
 'hood'  :('eq_hood',  1.50, 0.44),
 'mask'  :('eq_mask',  1.16, 0.55),
 'crown' :('eq_crown', 1.14, 0.00),
}
def build(outdir='art'):
    hx0=(HEAD['cx']-HEAD['w']/2)*S; hy0=(HEAD['cy']-HEAD['h']/2)*S
    hw=HEAD['w']*S; hh=HEAD['h']*S
    made=[]
    for name,(key,scale,vpos) in SPEC.items():
        src=Image.open('art/%s.webp'%key).convert('RGBA')
        ic=src.crop(src.getbbox())
        tw=hw*scale; th=ic.height*tw/ic.width
        r=ic.resize((max(1,round(tw)), max(1,round(th))), Image.LANCZOS)
        out=Image.new('RGBA',(S,S),(0,0,0,0))
        out.paste(r,(round(hx0+hw/2-r.width/2), round(hy0+hh*vpos-r.height/2)), r)
        p=os.path.join(outdir,'hw_%s.webp'%name)
        out.save(p,'WEBP',quality=92,method=6)
        made.append((name,os.path.getsize(p)))
    return made
if __name__=='__main__':
    for n,b in build(sys.argv[1] if len(sys.argv)>1 else 'art'): print('hw_%-6s %d bytes'%(n,b))
