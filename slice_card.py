# -*- coding: utf-8 -*-
"""Gemini 응답 카드(클립보드 캡처)에서 가로로 늘어선 4개 아이콘을 자동으로 찾아 자른다."""
import sys, os
import numpy as np
from PIL import Image

def cut(path, names, size=192, out='art', prefix='', pad=0.05):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    rgb = a[:,:,:3].astype(int); al = a[:,:,3]
    # 흰 배경(또는 아주 밝은 회색) 판정
    mx = rgb.max(axis=2); mn = rgb.min(axis=2)
    ink = ~(((mn > 228) & ((mx-mn) < 22)) | (al < 16))
    cols = ink.sum(axis=0); rows = ink.sum(axis=1)
    # 세로 밴드 (아이콘 줄) 찾기
    rthr = max(3, rows.max()*0.04)
    ys = [i for i,v in enumerate(rows) if v > rthr]
    if not ys: raise SystemExit('내용 없음')
    y0, y1 = ys[0], ys[-1]
    # 그 밴드 안에서만 열 프로파일 재계산
    band = ink[y0:y1+1]
    cols = band.sum(axis=0)
    cthr = max(2, cols.max()*0.03)
    groups=[]; cur=None
    for i,v in enumerate(cols):
        if v > cthr:
            if cur is None: cur=[i,i]
            else: cur[1]=i
        else:
            if cur is not None and (cur[1]-cur[0])>18: groups.append(cur)
            cur=None
    if cur is not None and (cur[1]-cur[0])>18: groups.append(cur)
    # 가까운 그룹 병합
    merged=[]
    for g in groups:
        if merged and g[0]-merged[-1][1] < 14: merged[-1][1]=g[1]
        else: merged.append(list(g))
    print('  찾은 아이콘 %d개 (기대 %d)'%(len(merged), len(names)))
    if len(merged) != len(names):
        print('  ! 개수 불일치 — 균등 분할로 대체')
        xs=[c for c in range(len(cols)) if cols[c]>cthr]
        x0,x1=xs[0],xs[-1]; w=(x1-x0+1)//len(names)
        merged=[[x0+i*w, x0+(i+1)*w-1] for i in range(len(names))]
    for (x0,x1), nm in zip(merged, names):
        if not nm: continue
        sub = im.crop((x0, y0, x1+1, y1+1))
        # 각 아이콘 안에서 다시 알파/흰배경 제거 + 타이트 크롭
        s = np.array(sub).astype(np.int16)
        r2 = s[:,:,:3]; a2 = s[:,:,3]
        mx2 = r2.max(axis=2); mn2 = r2.min(axis=2)
        white = (mn2 > 232) & ((mx2-mn2) < 16)
        s[:,:,3] = np.where(white, 0, a2)
        near = (mn2 > 206) & ((mx2-mn2) < 30) & (~white)
        soft = np.clip(255 - ((mn2-206)/(232-206)*255), 0, 255).astype(np.int16)
        s[:,:,3] = np.where(near, soft, s[:,:,3])
        c = Image.fromarray(s.astype(np.uint8),'RGBA')
        bb = c.getbbox()
        if not bb: print('  !! %s 비어 있음'%nm); continue
        c = c.crop(bb)
        w,h = c.size; sq = max(w,h); m = int(sq*pad)
        canv = Image.new('RGBA',(sq+2*m, sq+2*m),(0,0,0,0))
        canv.paste(c, ((sq+2*m-w)//2, (sq+2*m-h)//2), c)
        canv = canv.resize((size,size), Image.LANCZOS)
        p = os.path.join(out, prefix+nm+'.webp')
        canv.save(p,'WEBP',quality=92,method=6)
        print('  ✓ %s  %.1f KB'%(p, os.path.getsize(p)/1024))

if __name__=='__main__':
    cut(sys.argv[1], sys.argv[2].split(','), prefix=(sys.argv[3] if len(sys.argv)>3 else ''))
