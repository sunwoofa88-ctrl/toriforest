# -*- coding: utf-8 -*-
"""풀블리드 4칸 타일 스트립 → 정사각 낱개 타일 webp (배경 제거 없음)"""
import sys, os
from PIL import Image
def cut(path, names, size=256, out='art', prefix=''):
    im = Image.open(path).convert('RGB')
    W,H = im.size
    n = len(names); cw = W//n
    for i,nm in enumerate(names):
        if not nm: continue
        c = im.crop((i*cw, 0, (i+1)*cw, H))
        w,h = c.size
        s = min(w,h)                      # 정사각 가운데 자르기
        c = c.crop(((w-s)//2, (h-s)//2, (w-s)//2+s, (h-s)//2+s))
        c = c.resize((size,size), Image.LANCZOS)
        # 어린이 게임용 밝기 보정 : 원본 타일이 어두워 화면에서 침침했다.
        from PIL import ImageEnhance
        c = ImageEnhance.Brightness(c).enhance(1.20)
        c = ImageEnhance.Color(c).enhance(1.22)
        c = ImageEnhance.Contrast(c).enhance(1.06)
        p = os.path.join(out, prefix+nm+'.webp')
        c.save(p,'WEBP',quality=90,method=6)
        print('  ✓ %s  %.1f KB'%(p, os.path.getsize(p)/1024))
if __name__=='__main__':
    cut(sys.argv[1], sys.argv[2].split(','), prefix=(sys.argv[3] if len(sys.argv)>3 else ''))
