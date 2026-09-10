# MIT licence, (c) 2026 Imyala — Tower Lords model pipeline. Keep the credit, link back, and say what you changed.
# Apply the sculpted 3D enemy models to a TowerLords html build (towerlords.html / -mobile / models-preview.html).
#   python3 patch_game.py <build.html> <assets_dir> [out.html]
# <assets_dir> holds one <id>_asset.json per model (from bake.py). Re-runnable: an earlier patch (including the
# first scout-only version) is stripped first, so the build always ends up with exactly the current code + data.
import sys, json, os, re, glob
src, adir = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
html = open(src, encoding='utf-8').read()
code = open(os.path.join(here, 'models3d_code.js'), encoding='utf-8').read()

anchor = "function makeGoblinVariantMesh(scale,opts){ opts=opts||{}; const s=scale||1; const v=opts.variant||'scout';"
HOOK = " if(!opts.primitive){ const m3=makeGoblinModel3D(v,s); if(m3) return m3; }   // every goblin role is one of Imyala's sculpted models now — the primitive rig below is the fallback"
OLD_HOOK = " if(v==='scout'&&!opts.primitive){ const m3=makeGoblinScout3D(s); if(m3) return m3; }   // the scout is Imyala's sculpted model now — the primitive rig below is the fallback (and every other role)"

# ---- strip any earlier patch ----
for header in ("// ============================================================ GOBLIN SCOUT — the sculpted 3D model (Imyala)",
               "// ============================================================ SCULPTED 3D ENEMY MODELS (Imyala)"):
    i = html.find(header)
    if i >= 0:
        j = html.find(anchor, i); assert j > i, 'old model code block is not followed by the family builder'
        html = html[:i] + html[j:]
html = html.replace(OLD_HOOK, '').replace(HOOK, '')
html = re.sub(r'\n<script id="imyala-(?:goblin-scout|model-[a-z0-9-]+)" type="application/json">.*?</script>\n', '', html, flags=re.S)
assert html.count(anchor) == 1, ('anchor count', html.count(anchor))
assert 'imyala-model-' not in html and 'imyala-goblin-scout' not in html

# ---- code + hook ----
html = html.replace(anchor, code + anchor + HOOK)

# ---- feet-on-the-floor fix (builds only): builders place the body at .95*s (s = e.scale*ms*ENEMY_VISUAL_SCALE) but the
# loop forced it back to e.scale*.95, sinking every rigged enemy ~0.6 units into the ground. Keep the builder's rest height.
loop_old = "    b.material.emissiveIntensity = e.hitFlash>0?2 : telling?2 : (e.elite?.35:.08);\n    b.position.y=(e.scale*.95)+Math.sin(performance.now()*0.004+ex)*0.12 + (telling?0.28:0) - apWadeAt(ex,ez)*Math.min(.5,e.scale*.3);   // sink into the river"
loop_new = "    b.material.emissiveIntensity = e.hitFlash>0?2 : telling?2 : (e.elite?.35:.08);\n    if(b.userData.restY==null) b.userData.restY=b.position.y;   // the builder's rest height (.95*visual scale) — forcing e.scale*.95 here used to sink every rigged enemy ~0.6 units into the floor\n    b.position.y=b.userData.restY+Math.sin(performance.now()*0.004+ex)*0.12 + (telling?0.28:0) - apWadeAt(ex,ez)*Math.min(.5,e.scale*.3);   // sink into the river"
if loop_old in html: html = html.replace(loop_old, loop_new); print('applied feet-on-floor fix')
elif loop_new in html: print('feet-on-floor fix already present')
elif 'towerlords' in os.path.basename(src): raise SystemExit('enemy loop anchor not found in ' + src)

# ---- data blocks ----
blocks = []
for path in sorted(glob.glob(os.path.join(adir, '*_asset.json'))):
    A = json.load(open(path)); mid = A['h']['id']
    data = json.dumps(A, separators=(',', ':')); assert '</script' not in data
    blocks.append('\n<script id="imyala-model-' + mid + '" type="application/json">' + data + '</script>\n')
assert blocks, 'no *_asset.json in ' + adir
i = html.rfind('</body>'); assert i > 0
html = html[:i] + ''.join(blocks) + html[i:]
open(sys.argv[3] if len(sys.argv) > 3 else src, 'w', encoding='utf-8').write(html)
print('patched', src, 'with', len(blocks), 'models ->', len(html), 'chars')
