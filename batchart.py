#!/usr/bin/env python3
"""다운로드된 Gemini 시트들을 종 키에 순서대로 매핑해 art/ 로 굽는다."""
import os, sys, json, glob, subprocess
from mkart import split4, deband, norm

SRC = sys.argv[1] if len(sys.argv)>1 else '/mnt/user-data/uploads/Downloads'
SKIP = {'Gemini_Generated_Image_db1y4rdb1y4rdb1y.png'}   # 시험용 첫 장
sheets = json.load(open('sheets.json'))

files = [f for f in glob.glob(os.path.join(SRC,'Gemini_Generated_Image_*.png'))
         if os.path.basename(f) not in SKIP]
files.sort(key=lambda f: os.path.getmtime(f))
print('시트 파일 %d장 · 정의된 시트 %d장' % (len(files), len(sheets)))

os.makedirs('art', exist_ok=True)
n=0
for i,f in enumerate(files):
    if i>=len(sheets): break
    keys = sheets[i]['keys']
    try:
        quads = split4(f)
    except Exception as e:
        print(' ✗ %s : %s' % (os.path.basename(f), e)); continue
    for q,k in zip(quads, keys):
        r = norm(deband(q))
        if r is None:
            print('  빈 칸 %s (%s)' % (k, os.path.basename(f))); continue
        r.save('art/%s.webp'%k, 'WEBP', quality=88, method=6); n+=1
    print(' %02d %s → %s' % (i, os.path.basename(f)[:34], ','.join(keys)))
print('총 %d장 생성' % n)
