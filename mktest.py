import sys, io
src = open('game.html', encoding='utf-8').read()
i = src.index('<script>')
head = src[:i]           # css + html
js   = src[i+len('<script>'):]
test = open(sys.argv[1], encoding='utf-8').read()
out = """<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
""" + head + """</head><body><script>
""" + js + "\n" + test + "\n})();\n</script></body></html>"
open(sys.argv[2],'w',encoding='utf-8').write(out)
print('wrote', sys.argv[2], len(out))
