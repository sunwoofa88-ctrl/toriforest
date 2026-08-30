# -*- coding: utf-8 -*-
"""재료 아이콘 시트 프롬프트 — 12개(2줄×6칸)씩. 계열 2개를 한 장에 묶는다."""
import json, sys
D=json.load(open('/tmp/matcol.json'))
FAM={'leafy':'leaf','stone':'pebble','jelly':'jelly','pollenf':'flower','honey':'honey',
     'glowf':'firefly glow','frostf':'frost','emberf':'ember','windf':'wind',
     'crystalf':'crystal','shadef':'dark moon','starf':'starlight'}
FORM={'shard':'a jagged flat SHARD with sharp angular edges',
      'drop':'a round glossy DROPLET with a highlight',
      'pollen':'a small heap of fine sparkling POWDER',
      'pebble':'a plump teardrop SEED',
      'jelly':'a smooth rounded PEBBLE',
      'gem':'a faceted cut GEMSTONE with flat facets'}
i=int(sys.argv[1]); b=D[i*12:(i+1)*12]
lines=[]
for j,m in enumerate(b):
    fam=m['id'].rsplit('_',1)[0]
    lines.append("%d. %s made of %s material, colour %s"%(j+1, FORM[m['sh']], FAM[fam], m['c'].upper()))
print("New image, same clean art style: a grid of exactly 12 GAME ITEM ICONS, 2 rows of 6, on pure "
 "white, evenly spaced, each fully inside its own cell and NOT touching the others. Top row is 1-6 "
 "left to right, bottom row is 7-12 left to right. Each icon is a single small object seen straight "
 "on, centred in its cell, filling most of it. Thick uniform dark outline, flat cel shading with one "
 "soft shadow tone, a single small white highlight, no gradients, no glow, no ground shadow, no "
 "background. Chunky and readable at small size, cute mobile-game item icon style for a 7-year-old. "
 "THE ITEMS: " + " ".join(lines) +
 " NO text, NO labels, NO numbers, NO captions, NO borders, NO grid lines. Plain pure white background only.")
print('###KEYS', ' '.join(m['id'] for m in b))
