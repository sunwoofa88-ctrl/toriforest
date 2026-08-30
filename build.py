import sys, re
src = open('game.html', encoding='utf-8').read()
i = src.index('<script>')
head_html = src[:i]
body_js  = src[i:]
# <title> / <link> 은 head 로, 나머지 마크업은 body 로
# <title> 뒤에 이어지는 <meta>/<link> 는 전부 head 로 옮긴다.
# (홈 화면 아이콘·앱 이름 태그가 body 로 가면 '홈 화면에 추가' 때 안 잡힌다)
m = re.search(r'(<title>.*?</title>\s*(?:(?:<link[^>]*>|<meta[^>]*>)\s*)*)', head_html, re.S)
head_part = m.group(1)
rest = head_html[m.end():]
rest = re.sub(r'<meta name="viewport"[^>]*>\s*','',rest)
head_part = re.sub(r'<meta name="viewport"[^>]*>\s*','',head_part)
# ── 그림 파일 주입 ────────────────────────────────────────────────
# art/<key>.webp 를 base64 로 박아 넣는다. 파일이 없으면 아무것도 안 넣고,
# 게임은 절차적 그림으로 그대로 돌아간다 (그림이 없어도 절대 깨지지 않는다).
import os, base64, json
art = {}
if os.path.isdir('art'):
    for fn in sorted(os.listdir('art')):
        if not fn.lower().endswith(('.webp','.png')): continue
        k = os.path.splitext(fn)[0]
        b = open(os.path.join('art',fn),'rb').read()
        mime = 'image/webp' if fn.lower().endswith('.webp') else 'image/png'
        art[k] = 'data:%s;base64,%s' % (mime, base64.b64encode(b).decode())
# ── 글꼴 주입 ────────────────────────────────────────────────────
# ★ 예전에는 <link href="https://fonts.googleapis.com/..."> 로 불러왔다.
#   APK 는 오프라인이라 이 요청이 실패하고, 안드로이드 기본 글꼴로 떨어진다.
#   (실제로 테스트 브라우저에서도 fonts.googleapis.com 이 막혀 한 번도 안 불러와졌다)
#   글꼴을 파일째 박아 넣어야 어디서든 의도한 글씨체가 나온다.
font_css = ''
if os.path.isdir('fonts'):
    parts, tot = [], 0
    faces_json = os.path.join('fonts', 'faces.json')
    if os.path.exists(faces_json):
        # ── 규격판 : fonts/faces.json 이 있으면 그것만 믿는다 ──────────────
        #   gen_faces.py 가 Google Fonts 의 css2 응답에서 그대로 뽑아 만든다.
        #   글꼴 파일이 몇 개든(한글은 서브셋 80여 개) 손으로 목록을 고칠 일이 없다.
        faces = json.load(open(faces_json, encoding='utf-8'))
        for f in faces:
            fp = os.path.join('fonts', f['file'])
            if not os.path.exists(fp):
                raise SystemExit('!! 글꼴 파일 없음: %s' % fp)
            b = open(fp, 'rb').read(); tot += len(b)
            r = ("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:block;"
                 "src:url(data:font/woff2;base64,%s) format('woff2');"
                 % (f['family'], f['weight'], base64.b64encode(b).decode()))
            if f.get('range'): r += "unicode-range:%s;" % f['range']
            r += "}"
            parts.append(r)
    else:
        # ── 옛 방식 (파일 6개 고정) : faces.json 이 없을 때만 ──────────────
        FACES = [
            ('Jua',            'jua-la.woff2',      400, 'U+0000-00FF,U+0131,U+2000-206F,U+20A9,U+2070-20CF,U+2212,U+2215,U+FEFF,U+FFFD'),
            ('Jua',            'jua-ko.woff2',      400, 'U+AC00-D7A3,U+1100-11FF,U+3130-318F,U+A960-A97F,U+D7B0-D7FF'),
            ('BlackHanSans',   'bhs-la.woff2',      400, 'U+0000-00FF,U+0131,U+2000-206F,U+20A9,U+2070-20CF,U+2212,U+2215,U+FEFF,U+FFFD'),
            ('BlackHanSans',   'bhs-ko.woff2',      400, 'U+AC00-D7A3,U+1100-11FF,U+3130-318F,U+A960-A97F,U+D7B0-D7FF'),
            ('Fredoka',        'fredoka-600.woff2', 600, None),
            ('Fredoka',        'fredoka-700.woff2', 700, None),
        ]
        for fam, fn, wt, uni in FACES:
            fp = os.path.join('fonts', fn)
            if not os.path.exists(fp): continue
            b = open(fp,'rb').read(); tot += len(b)
            d = base64.b64encode(b).decode()
            r = ("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:block;"
                 "src:url(data:font/woff2;base64,%s) format('woff2');" % (fam, wt, d))
            if uni: r += "unicode-range:%s;" % uni
            r += "}"
            parts.append(r)
    if parts:
        font_css = '<style>' + ''.join(parts) + '</style>\n'
        print('  글꼴 %d개 주입 (%.2f MB)' % (len(parts), tot/1e6))

art_js = ''
if art:
    art_js = '<script>var ART_DATA=' + json.dumps(art, separators=(',',':')) + ';</script>\n'
    print('  그림 %d장 주입 (%.1f MB)' % (len(art), sum(len(v) for v in art.values())/1e6))

out = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#5CC24B">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="도토리숲 대모험 - 숲 동물 친구들과 함께하는 모험 액션 게임">
""" + head_part + font_css + """
<style>html,body{margin:0;padding:0;height:100%;background:#0E2A18}</style>
</head>
<body>
""" + rest + art_js + body_js + """
</body>
</html>
"""
open('dotorisup.html','w',encoding='utf-8').write(out)
print('built dotorisup.html', len(out), 'bytes')
