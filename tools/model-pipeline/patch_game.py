# MIT licence, (c) 2026 Imyala — Tower Lords model pipeline. Keep the credit, link back, and say what you changed.
# Apply the goblin-scout model to a TowerLords html build (towerlords.html / -mobile / models-preview).
import sys, json
src, asset = sys.argv[1], sys.argv[2]
html = open(src, encoding='utf-8').read()
import os
code = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gob_scout_code.js'), encoding='utf-8').read()
A = json.load(open(asset))
data = json.dumps(A, separators=(',', ':'))
assert '</script' not in data
anchor = "function makeGoblinVariantMesh(scale,opts){ opts=opts||{}; const s=scale||1; const v=opts.variant||'scout';"
assert html.count(anchor) == 1, ('anchor count', html.count(anchor))
assert 'imyala-goblin-scout' not in html, 'already patched'
hook = anchor + " if(v==='scout'&&!opts.primitive){ const m3=makeGoblinScout3D(s); if(m3) return m3; }   // the scout is Imyala's sculpted model now — the primitive rig below is the fallback (and every other role)"
html = html.replace(anchor, code + hook)
# feet-on-the-floor fix: builders place the body at .95*s (s = e.scale*ms*ENEMY_VISUAL_SCALE) but the loop forced it back to
# e.scale*.95, sinking every rigged enemy ~0.6 units into the ground. Remember the builder's rest height on first sight.
loop_old = "    b.material.emissiveIntensity = e.hitFlash>0?2 : telling?2 : (e.elite?.35:.08);\n    b.position.y=(e.scale*.95)+Math.sin(performance.now()*0.004+ex)*0.12 + (telling?0.28:0) - apWadeAt(ex,ez)*Math.min(.5,e.scale*.3);   // sink into the river"
loop_new = "    b.material.emissiveIntensity = e.hitFlash>0?2 : telling?2 : (e.elite?.35:.08);\n    if(b.userData.restY==null) b.userData.restY=b.position.y;   // the builder's rest height (.95*visual scale) — forcing e.scale*.95 here used to sink every rigged enemy ~0.6 units into the floor\n    b.position.y=b.userData.restY+Math.sin(performance.now()*0.004+ex)*0.12 + (telling?0.28:0) - apWadeAt(ex,ez)*Math.min(.5,e.scale*.3);   // sink into the river"
if loop_old in html:
    html = html.replace(loop_old, loop_new); print('applied feet-on-floor fix')
elif 'towerlords' in src: raise SystemExit('enemy loop anchor not found in ' + src)
block = '\n<script id="imyala-goblin-scout" type="application/json">' + data + '</script>\n'
i = html.rfind('</body>'); assert i > 0
html = html[:i] + block + html[i:]
open(sys.argv[3] if len(sys.argv) > 3 else src, 'w', encoding='utf-8').write(html)
print('patched', src, '->', len(html), 'chars')
