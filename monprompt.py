# -*- coding: utf-8 -*-
"""몬스터 시트 프롬프트 생성 — 4마리씩. 화풍 문장은 모든 시트에서 글자 하나 안 바꾼다
   (바꾸면 시트끼리 그림체가 갈린다)."""
import json, sys
from monname import describe, feature

STYLE = ("STYLE (identical for all four, this is a game sprite sheet): cute chibi mobile-game "
 "creature sprite, about 2 heads tall, big shiny friendly eyes with a white highlight, "
 "thick uniform dark outline, flat cel shading with exactly one soft shadow tone, "
 "no gradients, no glow, no drop shadow, no ground shadow, no background scenery, "
 "no perspective floor. Standing upright, facing the viewer straight on, FULL BODY with "
 "the feet visible at the very bottom of its cell. Appealing and friendly to a 7-year-old "
 "child - never scary, never gory. Each creature fills its own quarter of the image and "
 "does not touch the others. "
 "CRITICAL: the four must be instantly tellable apart FROM SILHOUETTE ALONE - clearly "
 "different body shapes, different heights and widths, different distinctive parts. "
 "Do NOT draw four recolours of the same round body with a white belly. "
 "Draw each animal's real defining features, exaggerated in a cute way.")
TAIL = ("NO text, NO labels, NO names, NO numbers, NO captions, NO borders, NO grid lines, "
 "NO shadows on the ground. Plain pure white background only.")

def sheet(batch):
    lines=[]
    for i,x in enumerate(batch):
        a=x['a']
        lines.append("%d. %s, with %s. Main body color %s, belly/underside %s, dark outline %s%s"%(
            i+1, describe(x['n']), feature(x['n']),
            a['body'].upper(), a['belly'].upper(), a['outline'].upper(),
            ', it is an ELITE variant so give it one extra flourish (a small gem, horn or glowing marking)'
              if x['rank']==1 else ''))
    return ("Generate ONE image: a horizontal strip of exactly 4 cute monster characters on a "
            "PURE WHITE background, evenly spaced left to right.\n\n" + STYLE +
            "\n\nTHE FOUR CREATURES, left to right:\n" + "\n".join(lines) + "\n\n" + TAIL)

if __name__=='__main__':
    d=json.load(open('/tmp/species.json'))['list']
    start=int(sys.argv[1]); n=int(sys.argv[2]) if len(sys.argv)>2 else 4
    b=d[start:start+n]
    print('KEYS:', ' '.join(x['k'] for x in b))
    print('---')
    print(sheet(b))
