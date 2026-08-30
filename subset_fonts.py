# 글꼴을 '게임이 실제로 쓰는 글자'만 남겨 깎는다.
#
# 왜 :  Google Fonts 가 내려주는 한글 woff2 는 서브셋 87~88조각(1.5MB)이다.
#       APK 는 오프라인이라 전부 박아 넣어야 하고, 그러면 보급형 폰 부팅이 2초 가까이 느려진다
#       (실측: 갤탭A9+ 6.6초 → 8.5초).
# 근거:  게임에는 글자 입력창이 하나도 없다(<input> 0 · contenteditable 0 · prompt() 0).
#       화면에 나올 수 있는 글자는 전부 game.html 안에 이미 있다. 그래서 정확히 그 집합만 남기면 된다.
#       (추측이 아니라 파일에서 센 값이다.)
import os, sys, json, unicodedata
from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

SRC = {   # 게임 font-family 이름 → (원본 ttf, weight, 가변축 고정값)
    'Jua':          ('/root/gfonts/ofl/jua/Jua-Regular.ttf',                   400, None),
    'BlackHanSans': ('/root/gfonts/ofl/blackhansans/BlackHanSans-Regular.ttf', 400, None),
    'Fredoka600':   ('/root/gfonts/ofl/fredoka/Fredoka[wdth,wght].ttf',        600, {'wght':600,'wdth':100}),
    'Fredoka700':   ('/root/gfonts/ofl/fredoka/Fredoka[wdth,wght].ttf',        700, {'wght':700,'wdth':100}),
}
FAMILY = {'Jua':'Jua','BlackHanSans':'BlackHanSans','Fredoka600':'Fredoka','Fredoka700':'Fredoka'}

def used_codepoints():
    s = open('game.html', encoding='utf-8').read()
    cps = set(map(ord, set(s)))
    # 게임이 만들어 낼 수 있는 글자를 놓치지 않도록 최소 안전집합을 더한다
    for c in range(0x20, 0x7F): cps.add(c)                 # ASCII 전체
    for c in '·×÷…—–‘’“”「」『』€₩％±°→←↑↓★☆♥♪✓✗∞≥≤≠': cps.add(ord(c))
    for c in range(0x3131, 0x3164): cps.add(c)             # 낱자(ㄱ~ㅣ)
    return {c for c in cps if c >= 0x20}

def main():
    cps = used_codepoints()
    han = sum(1 for c in cps if 0xAC00 <= c <= 0xD7A3)
    print('쓰는 글자 %d자 (한글 음절 %d자)' % (len(cps), han))
    os.makedirs('fonts', exist_ok=True)
    faces, tot = [], 0
    for key, (path, weight, axes) in SRC.items():
        if not os.path.exists(path):
            sys.exit('!! 원본 글꼴 없음: %s  (git clone google/fonts 필요)' % path)
        f = TTFont(path)
        if axes:
            from fontTools.varLib import instancer
            f = instancer.instantiateVariableFont(f, axes, updateFontNames=False, inplace=False)
        opt = Options()
        opt.layout_features = ['*']      # 한글 조합·커닝 보존
        opt.name_IDs        = ['*']
        opt.notdef_outline  = True
        opt.desubroutinize  = False
        opt.drop_tables     = []
        Subsetter(options=opt).subset(f) if False else None
        sub = Subsetter(options=opt)
        sub.populate(unicodes=cps)
        sub.subset(f)
        f.flavor = 'woff2'
        out = 'fonts/%s.woff2' % key.lower()
        f.save(out)
        n = os.path.getsize(out); tot += n
        faces.append({'family': FAMILY[key], 'file': os.path.basename(out),
                      'weight': weight, 'range': None, 'bytes': n})
        print('  %-13s %6.1f KB' % (key, n/1e3))
    json.dump(faces, open('fonts/faces.json','w'), ensure_ascii=False, indent=0)
    print('합계 %.2f MB → faces.json %d개' % (tot/1e6, len(faces)))

main()
