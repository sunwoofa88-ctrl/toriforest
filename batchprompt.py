# -*- coding: utf-8 -*-
import json, sys
from monprompt import sheet
B=json.load(open('/tmp/batches.json'))
D={x['k']:x for x in json.load(open('/tmp/species.json'))['list']}
i=int(sys.argv[1])
b=[D[k] for k in B[i]]
print(sheet(b).replace('\n\n',' ').replace('\n',' '))
