# MIT licence, (c) 2026 Imyala — Tower Lords model pipeline. Keep the credit, link back, and say what you changed.
# Goblin scout asset pipeline (Imyala / Tower Lords)
# decimated mesh -> box-projection UV charts -> packed atlas -> colour bake from the 4.6M-point
# sample cloud -> region auto-rig (root / armL / armR / legL / legR) -> quantised binary + JPEG atlas.
import numpy as np, struct, json, base64, io, sys, time
from scipy.spatial import cKDTree
from scipy import ndimage
from PIL import Image

MESH = sys.argv[1] if len(sys.argv) > 1 else 'out5k.bin'
ATLAS = int(sys.argv[2]) if len(sys.argv) > 2 else 1024
GUT = 3
t0 = time.time()

b = open(MESH, 'rb').read(); nv, nf = struct.unpack('ii', b[:8])
V = np.frombuffer(b[8:8 + nv * 24], np.float64).reshape(-1, 3).copy()
F = np.frombuffer(b[8 + nv * 24:], np.int32).reshape(-1, 3).copy()
print('mesh', V.shape, F.shape)

# ---- smooth per-vertex normals (area weighted) ----
e1 = V[F[:, 1]] - V[F[:, 0]]; e2 = V[F[:, 2]] - V[F[:, 0]]
fn = np.cross(e1, e2)                       # area-weighted face normal
N = np.zeros_like(V)
for k in range(3): np.add.at(N, F[:, k], fn)
N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)
fnu = fn / np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)

# ---- charts: dominant-axis label + connected components over shared edges ----
ax = np.argmax(np.abs(fnu), axis=1); sg = np.sign(fnu[np.arange(nf), ax]); label = ax * 2 + (sg > 0)
# edge -> faces
edges = np.concatenate([np.sort(F[:, [0, 1]], 1), np.sort(F[:, [1, 2]], 1), np.sort(F[:, [0, 2]], 1)])
eface = np.concatenate([np.arange(nf)] * 3)
key = edges[:, 0].astype(np.int64) * nv + edges[:, 1]
order = np.argsort(key); key = key[order]; eface = eface[order]
same = key[1:] == key[:-1]
fa = eface[:-1][same]; fb = eface[1:][same]
farea = 0.5 * np.linalg.norm(fn, axis=1)
DIRS = np.array([[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]], float)   # label = axis*2 + (sign>0)
ndot = fnu @ DIRS.T                                   # (nf,6) how well each direction suits each face
for it in range(12):                                  # majority-vote smoothing so charts are big, not confetti
    votes = np.zeros((nf, 6))
    np.add.at(votes, (fa, label[fb]), farea[fb]); np.add.at(votes, (fb, label[fa]), farea[fa])
    votes[np.arange(nf), label] += farea * 0.6        # a little inertia
    votes[ndot < 0.2] = -1                            # never project a face onto an axis it is edge-on / back-facing to
    new = votes.argmax(1); changed = (new != label).sum(); label = new
    if changed == 0: break
def components(label):
    m = label[fa] == label[fb]
    parent = np.arange(nf)
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for a, c in zip(fa[m], fb[m]):
        ra, rc = find(a), find(c)
        if ra != rc: parent[ra] = rc
    roots = np.array([find(i) for i in range(nf)])
    _, chart = np.unique(roots, return_inverse=True)
    return chart
TINY = 6
for it in range(30):                                  # fold confetti charts into the biggest neighbouring chart they can project onto
    chart = components(label); sizes = np.bincount(chart)
    tiny = sizes[chart] < TINY
    if not tiny.any(): break
    votes = np.full((nf, 6), -1.0)
    for a, c in ((fa, fb), (fb, fa)):
        sel = tiny[a] & (chart[c] != chart[a])
        np.add.at(votes, (a[sel], label[c[sel]]), sizes[chart[c[sel]]] + 1e-9)   # prefer joining the largest neighbour
    votes[ndot < (0.05 if it > 10 else 0.15)] = -1
    ok = votes.max(1) > 0
    label = np.where(ok, votes.argmax(1), label)
chart = components(label); nchart = chart.max() + 1
ax = label // 2; sg = np.where(label % 2 == 1, 1.0, -1.0)
print('charts', nchart, 'sizes: median %d, tiny(<4) %d' % (np.median(np.bincount(chart)), (np.bincount(chart) < 4).sum()))

# ---- planar projection per chart (drop the dominant axis) ----
proj_axes = {0: (1, 2), 1: (0, 2), 2: (0, 1)}   # x-normal -> (y,z), y-normal -> (x,z), z-normal -> (x,y)
cornerUV = np.zeros((nf, 3, 2))                   # in model units, chart-local
for c in range(nchart):
    fs = np.where(chart == c)[0]; a = ax[fs[0]]; pa, pb = proj_axes[a]
    P = V[F[fs]]                                  # (k,3,3)
    uv = np.stack([P[:, :, pa], P[:, :, pb]], -1)
    if sg[fs[0]] * (1 if a == 1 else -1) > 0: uv[:, :, 0] = -uv[:, :, 0]   # keep charts un-mirrored (cosmetic)
    uv -= uv.reshape(-1, 2).min(0)
    cornerUV[fs] = uv
chart_wh = np.zeros((nchart, 2))
for c in range(nchart):
    fs = chart == c; chart_wh[c] = cornerUV[fs].reshape(-1, 2).max(0)

# ---- skyline (bottom-left) packing with optional 90-degree rotation; binary-search the largest texel density that fits ----
def pack(density):
    wh = np.ceil(chart_wh * density).astype(int) + 1 + 2 * GUT
    order = np.argsort(-(wh.max(1) * 1000 + wh.min(1)))
    sky = [[0, 0, ATLAS]]                      # segments: x, y, width
    pos = np.zeros((nchart, 2), int); rot = np.zeros(nchart, bool)
    for c in order:
        best = None
        for r in (False, True):
            w, h = (wh[c][1], wh[c][0]) if r else (wh[c][0], wh[c][1])
            if w > ATLAS: continue
            for i, (sx, sy, sw) in enumerate(sky):
                if sx + w > ATLAS: break
                # the rect spans skyline segments i..j; its bottom is the max y among them
                y = sy; x2 = sx + w; j = i
                while j < len(sky) and sky[j][0] < x2:
                    y = max(y, sky[j][1]); j += 1
                if y + h > ATLAS: continue
                score = (y + h, sx)
                if best is None or score < best[0]: best = (score, i, r, sx, y, w, h)
        if best is None: return None
        _, i, r, x, y, w, h = best
        pos[c] = (x, y); rot[c] = r
        # update skyline: replace the covered span with one segment at y+h
        x2 = x + w; new = [[x, y + h, w]]
        rest = []
        for sx, sy, sw in sky:
            if sx + sw <= x or sx >= x2: rest.append([sx, sy, sw]); continue
            if sx < x: rest.append([sx, sy, x - sx])
            if sx + sw > x2: rest.append([x2, sy, sx + sw - x2])
        sky = sorted(rest + new)
        # merge equal-height neighbours
        merged = [sky[0]]
        for seg in sky[1:]:
            if seg[1] == merged[-1][1] and merged[-1][0] + merged[-1][2] == seg[0]: merged[-1][2] += seg[2]
            else: merged.append(seg)
        sky = merged
    return pos, wh, rot
lo, hi = 10.0, 2000.0
for _ in range(24):
    mid = (lo + hi) / 2
    if pack(mid) is None: hi = mid
    else: lo = mid
density = lo * 0.995; pos, wh, rot = pack(density)
for c in np.where(rot)[0]:                     # rotate the chart's local uv to match the packed orientation
    fs = chart == c; cornerUV[fs] = cornerUV[fs][:, :, ::-1]
print('texel density %.1f px/unit -> %.0f px across the model height' % (density, density * 1.9))
if len(sys.argv) > 3 and sys.argv[3] == 'stats': sys.exit(0)
# final per-corner atlas UV (pixels, y down) and normalised (v up, matching three.js flipY)
cornerPX = np.zeros((nf, 3, 2))
for c in range(nchart):
    fs = chart == c
    cornerPX[fs] = cornerUV[fs] * density + pos[c] + GUT + 0.5
uvN = np.stack([cornerPX[:, :, 0] / ATLAS, 1 - cornerPX[:, :, 1] / ATLAS], -1)

# ---- bake: splat the sample cloud into the atlas ----
d = np.load('/mnt/user-data/uploads/TowerLords/GameAssets/3dAssets/_tmp_gob_points.npz'); P = d['P'].astype(np.float64); C = d['C'].astype(np.float64)
cent = V[F].mean(1); tree = cKDTree(cent)
A = V[F[:, 0]]; B = V[F[:, 1]]; Cc = V[F[:, 2]]
def closest_bary(p, f):
    """closest point on triangles f (n,) to points p (n,3): returns barycentric (n,3), dist2 (n,) [Ericson]"""
    a = A[f]; b = B[f]; c = Cc[f]
    ab = b - a; ac = c - a; ap = p - a
    d1 = (ab * ap).sum(1); d2 = (ac * ap).sum(1)
    bp = p - b; d3 = (ab * bp).sum(1); d4 = (ac * bp).sum(1)
    cp = p - c; d5 = (ab * cp).sum(1); d6 = (ac * cp).sum(1)
    va = d3 * d6 - d5 * d4; vb = d5 * d2 - d1 * d6; vc = d1 * d4 - d3 * d2
    n = len(p); u = np.zeros(n); v = np.zeros(n)   # u along ab, v along ac
    done = np.zeros(n, bool)
    r = (d1 <= 0) & (d2 <= 0); u[r] = 0; v[r] = 0; done |= r
    r = (~done) & (d3 >= 0) & (d4 <= d3); u[r] = 1; v[r] = 0; done |= r
    r = (~done) & (d6 >= 0) & (d5 <= d6); u[r] = 0; v[r] = 1; done |= r
    r = (~done) & (vc <= 0) & (d1 >= 0) & (d3 <= 0); tt = d1 / np.maximum(d1 - d3, 1e-30); u[r] = tt[r]; v[r] = 0; done |= r
    r = (~done) & (vb <= 0) & (d2 >= 0) & (d6 <= 0); tt = d2 / np.maximum(d2 - d6, 1e-30); u[r] = 0; v[r] = tt[r]; done |= r
    r = (~done) & (va <= 0) & ((d4 - d3) >= 0) & ((d5 - d6) >= 0); tt = (d4 - d3) / np.maximum((d4 - d3) + (d5 - d6), 1e-30); u[r] = 1 - tt[r]; v[r] = tt[r]; done |= r
    r = ~done; den = 1.0 / np.maximum(va + vb + vc, 1e-30); u[r] = (vb * den)[r]; v[r] = (vc * den)[r]
    q = a + ab * u[:, None] + ac * v[:, None]
    return np.stack([1 - u - v, u, v], -1), ((q - p) ** 2).sum(1)
acc = np.zeros((ATLAS, ATLAS, 3)); cnt = np.zeros((ATLAS, ATLAS))
K = 8; CH = 400000
for s in range(0, len(P), CH):
    p = P[s:s + CH]; col = C[s:s + CH]
    _, cand = tree.query(p, k=K)
    best_d = np.full(len(p), np.inf); best_f = np.zeros(len(p), int); best_b = np.zeros((len(p), 3))
    for k in range(K):
        f = cand[:, k]; bary, d2 = closest_bary(p, f)
        m = d2 < best_d; best_d[m] = d2[m]; best_f[m] = f[m]; best_b[m] = bary[m]
    px = (cornerPX[best_f] * best_b[:, :, None]).sum(1)
    ix = np.clip(px[:, 0].astype(int), 0, ATLAS - 1); iy = np.clip(px[:, 1].astype(int), 0, ATLAS - 1)
    np.add.at(acc, (iy, ix), col); np.add.at(cnt, (iy, ix), 1)
    print('  splat %d/%d (max dist %.4f)' % (s + len(p), len(P), np.sqrt(best_d.max())), flush=True)
has = cnt > 0
img = np.zeros_like(acc); img[has] = acc[has] / cnt[has][:, None]
print('covered texels', has.sum(), 'time', time.time() - t0)
# dilation fill: holes inside charts first, then gutters, then the background with the mean colour
filled = has.copy(); out = img.copy()
for it in range(GUT + 6):
    if filled.all(): break
    k = np.ones((3, 3)); s3 = ndimage.convolve(out * filled[:, :, None], k[:, :, None], mode='constant'); n3 = ndimage.convolve(filled.astype(float), k, mode='constant')
    grow = (~filled) & (n3 > 0); out[grow] = s3[grow] / n3[grow][:, None]; filled |= grow
mean = img[has].mean(0); out[~filled] = mean
out = 255.0 * np.power(np.clip(out, 0, 255) / 255.0, 0.9)   # lift the midtones a touch — the sculpt's texture is darker than the painted rigs it stands beside
atlas = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
atlas.save('atlas_%d.png' % ATLAS)

# ---- auto-rig: region weights in model space (unit model, y up, faces +Z) ----
def smooth(x, a, b):   # 0 at a, 1 at b
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
x, y, z = V[:, 0], V[:, 1], V[:, 2]
armW = smooth(np.abs(x), 0.34, 0.46) * (1 - smooth(y, -0.02, 0.10))       # outside the torso, below the shoulder line
legW = (1 - armW) * smooth(-y, 0.45, 0.60)                                 # below the hips
rootW = 1 - armW - legW
side = (x >= 0).astype(int)                                                 # 0 = left (-x), 1 = right (+x)
BONE_ROOT, BONE_ARM_L, BONE_ARM_R, BONE_LEG_L, BONE_LEG_R = 0, 1, 2, 3, 4
skinIdx = np.zeros((nv, 4), np.uint8); skinW = np.zeros((nv, 4))
skinIdx[:, 0] = BONE_ROOT; skinW[:, 0] = rootW
skinIdx[:, 1] = np.where(side == 1, BONE_ARM_R, BONE_ARM_L); skinW[:, 1] = armW
skinIdx[:, 2] = np.where(side == 1, BONE_LEG_R, BONE_LEG_L); skinW[:, 2] = legW
skinW /= skinW.sum(1, keepdims=True)
print('weights: arm verts %d, leg verts %d' % ((armW > .5).sum(), (legW > .5).sum()))
bones = {'root': [0, 0, 0], 'armL': [-0.38, 0.0, 0.0], 'armR': [0.38, 0.0, 0.0], 'legL': [-0.25, -0.5, 0.0], 'legR': [0.25, -0.5, 0.0]}

# ---- wedges: split vertices per chart so each corner owns its UV ----
wkey = F.astype(np.int64) * nchart + chart[:, None]          # (nf,3)
uk, inv = np.unique(wkey.ravel(), return_inverse=True)
wv = (uk // nchart).astype(int)                                # wedge -> position vertex
idx = inv.reshape(nf, 3)
wuv = np.zeros((len(uk), 2)); wuv[inv] = uvN.reshape(-1, 2)   # each wedge gets its (identical) chart uv
print('wedge verts', len(uk), 'faces', nf)

# ---- quantise + pack ----
mn = V.min(0); mx = V.max(0); scale = (mx - mn) / 65535.0
qpos = np.round((V[wv] - mn) / scale).astype(np.uint16)
qnrm = np.clip(np.round(N[wv] * 127), -127, 127).astype(np.int8)
quv = np.clip(np.round(wuv * 65535), 0, 65535).astype(np.uint16)
qsi = skinIdx[wv]; qsw = np.clip(np.round(skinW[wv] * 255), 0, 255).astype(np.uint8)
# fix rounding so weights still sum to 255
diff = 255 - qsw.astype(int).sum(1); qsw[:, 0] = np.clip(qsw[:, 0].astype(int) + diff, 0, 255)
assert len(uk) < 65536
header = {'nv': int(len(uk)), 'nf': int(nf), 'min': [round(v, 6) for v in mn.tolist()], 'scale': scale.tolist(), 'bones': bones,
          'order': 'pos:u16x3 uv:u16x2 idx:u16x3 nrm:i8x3 si:u8x4 sw:u8x4 (2-byte arrays first so typed-array views stay aligned)'}
blob = b''.join([qpos.tobytes(), quv.tobytes(), idx.astype(np.uint16).tobytes(), qnrm.tobytes(), qsi.tobytes(), qsw.tobytes()])
open('goblin_scout.bin', 'wb').write(blob); json.dump(header, open('goblin_scout.json', 'w'))
buf = io.BytesIO(); atlas.convert('RGB').save(buf, 'JPEG', quality=86, optimize=True, subsampling=0)
jpg = buf.getvalue(); open('atlas_%d.jpg' % ATLAS, 'wb').write(jpg)
print('geometry bytes', len(blob), 'b64', len(base64.b64encode(blob)), '| jpeg bytes', len(jpg), 'b64', len(base64.b64encode(jpg)))
json.dump({'h': header, 'geo': base64.b64encode(blob).decode(), 'tex': 'data:image/jpeg;base64,' + base64.b64encode(jpg).decode()}, open('goblin_scout_asset.json', 'w'))
print('total', time.time() - t0)
