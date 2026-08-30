# -*- coding: utf-8 -*-
"""AI 스트립(가로 4칸) → 낱개 아이콘 webp.
   흰 배경 제거 → 내용물 기준 자동 잘라내기 → 정사각 여백 → 256px webp"""
import sys, os
from PIL import Image
import numpy as np

def cut(path, names, n=4, size=192, pad=0.06, out='art', prefix=''):
    im = Image.open(path).convert('RGBA')
    W,H = im.size
    cw = W//n
    made=[]
    for i,nm in enumerate(names):
        if not nm: continue
        c = im.crop((i*cw, 0, (i+1)*cw, H))
        a = np.array(c).astype(np.int16)
        rgb = a[:,:,:3]; al = a[:,:,3]
        # 흰 배경 → 투명 (밝고 채도 낮은 픽셀)
        mx = rgb.max(axis=2); mn = rgb.min(axis=2)
        white = (mn > 232) & ((mx-mn) < 16)
        al2 = np.where(white, 0, al)
        # 가장자리 반투명 처리 : 흰색에 가까울수록 알파를 낮춘다 (계단 방지)
        near = (mn > 205) & ((mx-mn) < 30) & (~white)
        soft = ((mn[near]-205)/(232-205)*255).astype(np.int16)
        tmp = al2.copy(); tmp[near] = np.clip(255-soft, 0, 255)
        a[:,:,3] = tmp
        c = Image.fromarray(a.astype(np.uint8), 'RGBA')
        bb = c.getbbox()
        if not bb: 
            print('  !! %s : 내용 없음'%nm); continue
        c = c.crop(bb)
        w,h = c.size; s = max(w,h)
        m = int(s*pad)
        sq = Image.new('RGBA',(s+2*m, s+2*m),(0,0,0,0))
        sq.paste(c, ((s+2*m-w)//2, (s+2*m-h)//2), c)
        sq = sq.resize((size,size), Image.LANCZOS)
        p = os.path.join(out, prefix+nm+'.webp')
        sq.save(p, 'WEBP', quality=92, method=6)
        made.append((p, os.path.getsize(p)))
    return made

if __name__=='__main__':
    src = sys.argv[1]
    names = sys.argv[2].split(',')
    pre = sys.argv[3] if len(sys.argv)>3 else ''
    for p,sz in cut(src, names, n=len(names), prefix=pre):
        print('  ✓ %s  %.1f KB'%(p, sz/1024))
