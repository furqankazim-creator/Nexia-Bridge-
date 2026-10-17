# Finds the page of each contents entry in the built PDF so the next build can print page numbers.
import fitz, json, re, sys
pdf = sys.argv[1]
d = fitz.open(pdf)
texts = [p.get_text() for p in d]
toc = json.loads(sys.argv[2])
out = {}
for id_, label in toc:
    key = label.split('. ', 1)[1] if '. ' in label else label
    for i, t in enumerate(texts):
        if i < 3: continue
        if id_.startswith('chapter-'):
            n = label.split('.')[0]
            if re.search(rf'chapter\s+{n}\b', t, re.I) and key in t: out[id_] = i + 1; break
        elif key in t and (label in t or key in t.split('\n')[0:6] or key in ' '.join(t.split('\n')[:4])):
            out[id_] = i + 1; break
json.dump(out, open(sys.argv[3], 'w'))
print(out)
