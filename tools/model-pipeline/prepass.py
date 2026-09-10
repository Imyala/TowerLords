# MIT licence, (c) 2026 Imyala — Tower Lords model pipeline. Keep the credit, link back, and say what you changed.
# Local pre-pass (numpy + PIL only): Meshy OBJ zip -> <id>_clustered.npz (vertex-clustered mesh, ~300k tris)
#                                                +  <id>_points.npz    (every vertex + face centroid, coloured from the texture)
# usage: python3 prepass.py <model.zip> <id> <out_dir>   (needs `unzip`, `grep`, `cut`, `tr` on PATH)
import sys, os, subprocess, glob, shutil, tempfile, numpy as np
from PIL import Image
zpath, mid, out = sys.argv[1], sys.argv[2], sys.argv[3]
H = float(os.environ.get('CLUSTER_H', '0.008'))
work = tempfile.mkdtemp(prefix='prepass_' + mid + '_', dir=os.path.expanduser('~/scratch'))
try:
    subprocess.run(['unzip', '-o', '-q', zpath, '-d', work], check=True)
    obj = glob.glob(work + '/**/*.obj', recursive=True)[0]; tex = glob.glob(work + '/**/*.png', recursive=True)[0]
    for pre, name in (("^v ", 'v'), ("^vt ", 'vt'), ("^f ", 'f')):
        cut = 3 if name == 'v' else 4 if name == 'vt' else 3
        subprocess.run(f"grep '{pre}' '{obj}' | cut -c{cut}- | tr '/' ' ' > {work}/{name}.txt", shell=True, check=True)
    V = np.fromfile(f'{work}/v.txt', sep=' ', dtype=np.float32).reshape(-1, 3)
    VT = np.fromfile(f'{work}/vt.txt', sep=' ', dtype=np.float32).reshape(-1, 2)
    F = np.fromfile(f'{work}/f.txt', sep=' ', dtype=np.int64).reshape(-1, 9)
    fv = (F[:, [0, 3, 6]] - 1).astype(np.int32); ft = (F[:, [1, 4, 7]] - 1).astype(np.int32); del F
    mn, mx = V.min(0), V.max(0)
    print(mid, 'verts', len(V), 'faces', len(fv), 'bbox min', mn.round(3), 'max', mx.round(3), 'size', (mx - mn).round(3))
    # ---- vertex clustering (positions only; each face keeps its own corner uvs so seams survive) ----
    cell = np.floor((V - mn) / H).astype(np.int64); key = (cell[:, 0] * 100003 + cell[:, 1]) * 100003 + cell[:, 2]
    uk, inv = np.unique(key, return_inverse=True); n = len(uk); cnt = np.bincount(inv, minlength=n)
    C = np.stack([np.bincount(inv, weights=V[:, k], minlength=n) / cnt for k in range(3)], 1)
    f = inv[fv]; ok = (f[:, 0] != f[:, 1]) & (f[:, 1] != f[:, 2]) & (f[:, 0] != f[:, 2]); f = f[ok]; t = ft[ok]
    s = np.sort(f, 1); sk = (s[:, 0].astype(np.int64) * n + s[:, 1]) * n + s[:, 2]; _, first = np.unique(sk, return_index=True); f = f[first]; t = t[first]
    np.savez_compressed(f'{out}/{mid}_clustered.npz', V=C.astype(np.float32), F=f.astype(np.int32), UV=(np.clip(VT[t], 0, 1) * 65535 + .5).astype(np.uint16))
    print('  clustered', n, 'verts', len(f), 'faces')
    # ---- colour samples: every original vertex (first corner's uv) + every face centroid ----
    im = np.asarray(Image.open(tex).convert('RGB')); Hh, Ww, _ = im.shape
    def sample(uv):
        x = np.clip((uv[:, 0] * Ww).astype(np.int64), 0, Ww - 1); y = np.clip(((1 - uv[:, 1]) * Hh).astype(np.int64), 0, Hh - 1); return im[y, x]
    u, firstc = np.unique(fv.ravel(), return_index=True); vuv = np.zeros((len(V), 2), np.float32); vuv[u] = VT[ft.ravel()[firstc]]
    P = np.concatenate([V, V[fv].mean(1).astype(np.float32)]); Cc = np.concatenate([sample(vuv), sample(VT[ft].mean(1))])
    np.savez_compressed(f'{out}/{mid}_points.npz', P=P.astype(np.float16), C=Cc.astype(np.uint8))
    print('  points', len(P))
finally:
    shutil.rmtree(work, ignore_errors=True)
