# fonts/*.css (Google Fonts css2 응답) 를 읽어 fonts/faces.json 을 만든다.
# 규칙 : css 안의 @font-face 순서 = 내려받은 <prefix>-<i>.woff2 의 i 순서.
# 사람이 좌표를 손으로 박지 않는다. 파일과 css 에서 그대로 읽는다.
import re, json, os
JOBS = [  # (css 파일, 게임에서 쓰는 font-family 이름)
    ('jua.css',      'Jua'),
    ('bhs.css',      'BlackHanSans'),
    ('fredoka6.css', 'Fredoka'),
    ('fredoka7.css', 'Fredoka'),
]
BLOCK = re.compile(r'@font-face\s*\{(.*?)\}', re.S)
def val(body, key):
    m = re.search(key + r'\s*:\s*([^;]+);', body)
    return m.group(1).strip() if m else None

faces, missing = [], []
for css, fam in JOBS:
    pre = os.path.splitext(css)[0]
    text = open(os.path.join('fonts', css), encoding='utf-8-sig').read()
    for i, m in enumerate(BLOCK.finditer(text)):
        b = m.group(1)
        fn = '%s-%d.woff2' % (pre, i)
        if not os.path.exists(os.path.join('fonts', fn)):
            missing.append(fn); continue
        w = val(b, 'font-weight') or '400'
        faces.append({
            'family': fam,
            'file':   fn,
            'weight': int(re.findall(r'\d+', w)[0]),
            'range':  val(b, 'unicode-range'),
            'bytes':  os.path.getsize(os.path.join('fonts', fn)),
        })
if missing:
    raise SystemExit('!! woff2 없음: %s' % missing[:5])
json.dump(faces, open('fonts/faces.json', 'w'), ensure_ascii=False, indent=0)
print('faces %d · %.2f MB' % (len(faces), sum(f['bytes'] for f in faces)/1e6))
for fam in dict.fromkeys(f['family'] for f in faces):
    sub = [f for f in faces if f['family'] == fam]
    print('  %-13s %3d개  %.0f KB  weight %s' % (fam, len(sub), sum(f['bytes'] for f in sub)/1e3,
          sorted({f['weight'] for f in sub})))
