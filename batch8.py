# -*- coding: utf-8 -*-
import json, sys
from monname import describe, feature
B=json.load(open('/tmp/batches8.json'))
D={x['k']:x for x in json.load(open('/tmp/species.json'))['list']}
i=int(sys.argv[1]); ks=B[i]; n=len(ks)
rows = 2 if n>4 else 1
per = (n+rows-1)//rows
lines=[]
for j,k in enumerate(ks):
    x=D[k]; a=x['a']
    lines.append("%d. %s, with %s. Body %s, belly %s, outline %s%s."%(
      j+1, describe(x['n']), feature(x['n']),
      a['body'].upper(), a['belly'].upper(), a['outline'].upper(),
      ' It is an ELITE so add one extra flourish (a small gem, horn or glowing marking)'
        if x['rank']==1 else ''))
lay = ("a grid of exactly %d cute monster characters, %d rows of %d, evenly spaced, "
       "each fully inside its own cell and NOT touching the others"%(n,rows,per)) if rows>1 else \
      ("a horizontal strip of exactly %d cute monster characters, evenly spaced"%n)
print("Same art style and same rules as before. Generate ONE new image on a PURE WHITE background: "
 + lay + ". Numbering runs left to right along the TOP row first, then left to right along the "
 "BOTTOM row. Each one must be tellable apart from silhouette alone - different body shapes, "
 "heights and widths. Full body, feet at the bottom of its cell, facing the viewer, thick uniform "
 "dark outline, flat cel shading, no gradients, no glow, no ground shadow, no background. "
 "Cute and friendly for a 7-year-old, never scary. ABSOLUTELY NO WRITING ANYWHERE IN THE IMAGE - no names, no captions, no letters, no numbers under or beside the creatures. THE CREATURES: "
 + " ".join(lines) +
 " NO text, NO labels, NO numbers, NO captions, NO borders, NO grid lines. Plain pure white background only.")
print('###KEYS', ' '.join(ks))
