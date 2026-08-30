#!/usr/bin/env python3
"""앱 아이콘 : AI 주인공 그림 + 숲 배경으로 만든다.
   런처 아이콘은 아주 작게(48px) 보이므로 규칙은 하나 — 멀리서도 '누구'인지 읽혀야 한다.
   ① 배경은 단순한 한 덩어리 색  ② 주인공을 크게  ③ 굵은 테두리로 형태를 잘라낸다"""
from PIL import Image, ImageDraw, ImageFilter
import os, math

S = 512
hero = Image.open('art/hero_idle.webp').convert('RGBA')

def rounded(size, r, fill):
    im = Image.new('RGBA', (size,size), (0,0,0,0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0,0,size-1,size-1], radius=r, fill=fill)
    return im

def make(square=True):
    im = Image.new('RGBA', (S,S), (0,0,0,0))
    # ── 배경 : 숲 초록 그라데이션 ──
    bg = Image.new('RGBA', (S,S), (0,0,0,0))
    d = ImageDraw.Draw(bg)
    for y in range(S):
        t = y/S
        r = int(0x7E + (0x4A-0x7E)*t)
        g = int(0xC8 + (0x8E-0xC8)*t)
        b = int(0x5E + (0x3C-0x5E)*t)
        d.line([(0,y),(S,y)], fill=(r,g,b,255))
    # 부드러운 빛 (왼쪽 위)
    glow = Image.new('RGBA', (S,S), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-S*0.25, -S*0.30, S*0.85, S*0.80], fill=(255,255,210,90))
    glow = glow.filter(ImageFilter.GaussianBlur(S*0.10))
    bg = Image.alpha_composite(bg, glow)
    # 마스크
    if square:
        mask = rounded(S, int(S*0.22), (255,255,255,255)).split()[3]
    else:
        m = Image.new('L', (S,S), 0)
        ImageDraw.Draw(m).ellipse([0,0,S-1,S-1], fill=255)
        mask = m
    im.paste(bg, (0,0), mask)
    # ── 도토리 실루엣 무늬(아주 옅게) ──
    pat = Image.new('RGBA', (S,S), (0,0,0,0))
    pd = ImageDraw.Draw(pat)
    for i in range(7):
        a = i/7*2*math.pi
        cx = S*0.5 + math.cos(a)*S*0.40
        cy = S*0.5 + math.sin(a)*S*0.40
        pd.ellipse([cx-S*0.055, cy-S*0.055, cx+S*0.055, cy+S*0.055], fill=(255,255,255,26))
    pat.putalpha(Image.composite(pat.split()[3], Image.new('L',(S,S),0), mask))
    im = Image.alpha_composite(im, pat)
    # ── 주인공 ──
    bb = hero.getbbox()
    h = hero.crop(bb)
    scale = (S*0.74)/max(h.size)
    h = h.resize((max(1,int(h.width*scale)), max(1,int(h.height*scale))), Image.LANCZOS)
    # 어두운 테두리 (작게 보여도 형태가 잘린다)
    sil = Image.new('RGBA', h.size, (26,18,12,255))
    sil.putalpha(h.split()[3])
    ring = Image.new('RGBA', (S,S), (0,0,0,0))
    ox, oy = (S-h.width)//2, int(S*0.60)-h.height//2
    w = max(3, int(S*0.014))
    for k in range(16):
        a = k/16*2*math.pi
        ring.alpha_composite(sil, (ox+int(math.cos(a)*w), oy+int(math.sin(a)*w)))
    im = Image.alpha_composite(im, ring)
    im.alpha_composite(h, (ox, oy))
    return im

sq = make(True)
rd = make(False)
sq.save('icon_512.png')
os.makedirs('icons', exist_ok=True)
SIZES = {'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
for k,v in SIZES.items():
    sq.resize((v,v), Image.LANCZOS).save('icons/%s_ic_launcher.png'%k)
    rd.resize((v,v), Image.LANCZOS).save('icons/%s_ic_launcher_round.png'%k)
sq.resize((192,192), Image.LANCZOS).save('icon_192.png')
print('아이콘 생성 완료')
