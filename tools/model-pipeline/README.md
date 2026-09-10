# Tower Lords — 3D model pipeline (Imyala)

MIT licence, © 2026 Imyala. Fork it, improve it, ship it in a mod pack — but keep Imyala in the
credits, link back to the original, and if you release a modified version say what you changed so
people know which parts are yours.

Turns a heavy AI/ZBrush-style sculpt (the goblin scout came in at **3 million triangles / 337 MB OBJ**)
into a ~400 KB self-contained asset that lives inside the single-file game builds, keeps its texture,
and still animates through the engine's walk-swing contract.

## Steps (goblin scout as the worked example)

| # | Where | Script | What it does |
|---|-------|--------|--------------|
| 1 | local (numpy only) | `parse.py` | Split the OBJ with grep, load `v` / `vt` / `f` with numpy. |
| 2 | local | `cluster.py 0.008` | Vertex-clustering pre-pass (3 M → ~300 k tris) so the mesh is small enough to move around. Writes `gob_clustered.npz`. |
| 3 | local | `samples.py` | Samples the original 2048² texture at every original vertex + face centroid → a 4.6 M coloured point cloud (`gob_points.npz`). This is what the colours are re-baked from, so the heavy UV atlas never has to be preserved through decimation. |
| 4 | anywhere with gcc | `qem.c` | Quadric edge-collapse decimation (Garland–Heckbert) with boundary planes and fold-over rejection. `gcc -O2 -o qem qem.c -lm && ./qem in.bin out5k.bin 5000` (input: `int32 nv, nf, float64 verts, int32 faces`). ~2 s. |
| 5 | numpy + scipy | `bake.py <id> <id>_5k.bin <id>_points.npz <out_dir>` | Smooth normals → box-projection UV charts (majority-vote smoothed, confetti merged) → skyline-packed 1024 atlas → colours splatted from the point cloud and hole-filled → region-growing auto-rig (see below) → quantised binary + JPEG atlas → `<id>_asset.json`, plus `<id>_atlas.png`, `<id>_5k.obj/.mtl` (for Blender/Godot) and `<id>_rig.png` (the weights, for checking). Knobs: `ATLAS=768` / `JPEG_Q=80` env vars shrink the payload. |
| 6 | — | `patch_game.py <build.html> <assets_dir>` | Drops `models3d_code.js` (decoder + `makeModel3D` registry + `makeGoblinModel3D`) in front of `makeGoblinVariantMesh`, hooks every goblin role to it, appends one `<script id="imyala-model-<id>" type="application/json">` data block per asset, and applies the feet-on-the-floor fix to the enemy loop. Re-runnable — it strips the previous patch first. Run it on `towerlords.html`, `towerlords-mobile.html` and `models-preview.html`, then `node .claude/build-offline.js`. |

Steps 1–3 are one call now: `prepass.py <model.zip> <id> <out_dir>` (≈10 s per sculpt on the Mac). Each embedded model
costs ≈370 KB in the html (≈140 KB geometry + ≈230 KB atlas, base64).

## Binary layout (`<id>_asset.json → geo`, base64)

`pos:u16×3 · uv:u16×2 · idx:u16×3 · nrm:i8×3 · limb:u8 · limbW:u8` — the 2-byte arrays come first so the
typed-array views stay aligned; each vertex blends one limb bone (1 armL, 2 armR, 3 legL, 4 legR, 0 none)
with the root. `h.min` / `h.scale` de-quantise positions into model
units: 1 unit = scale 1, Y up, faces **+Z**, feet at y = −0.95 (so the engine's `body.position.y = .95·s`
puts the feet on the floor), bone pivots in `h.bones`.

## Engine contract the model keeps

* root `Group` → `userData.body` is a zero-area anchor `Mesh` whose **material** is shared with the
  `SkinnedMesh` child, so the engine's hit-flash / telegraph `emissiveIntensity`, enrage colour and
  affix emissive all still land on the visible model; `body.rotation.y` is the heading, `body.scale`
  the telegraph puff.
* `userData.humanoid = true`, `userData.arms = [armL, armR]`, `userData.legs = [legL, legR]` are the
  `THREE.Bone`s — the enemy loop sets `rotation.x` on them exactly as it does on the primitive rigs.
* `material.userData.kind = 'skin'` lets `crGrade` roll the per-goblin lightness so a pack isn't clones;
  `noDetail` stops `apRealism` layering a procedural detail map over the baked texture.
* Any decode failure logs a warning and falls back to the primitive rig — the game never loses an enemy.

## The auto-rig (bake.py `RIG` table)

Hands are seeded far out to the side (`armSeedX`) and grown inward over mesh edges (cracks bridged by a
3 cm proximity graph) until they hit the torso barrier `|x| < armInner`; below the hips only things further
out than `armFar` count as arm, so a hanging weapon joins the arm but the thigh never does, and an ear box
(`earX/earY/earZ`) keeps raised arms out of the ears. Feet are seeded low (`legSeedY`, `legSeedZ`) and grown
up to `hipY`. Labels are diffused over the mesh for soft joints and each bone's pivot is the centroid of
its boundary with the body. `rootBoxes` force regions to the body (a cape, a trap on the ground, a shield),
`arms=False` / `legs=False` switch a swing off for models it would only bend (a two-handed bow, a planted
spear, a floor-length robe) — the game then simply doesn't register those bones, and the body bob still
runs. Always look at `<id>_rig.png` before shipping a model.

## Adding the next race

Drop the sculpt zips in `GameAssets/<Race>/`, run `prepass.py` per model, `qem`, then `bake.py` with a
`RIG` entry per model (look at the rig plot, adjust), put the assets in `GameAssets/3dAssets/<race>/`, add a
`make<Race>Model3D(v, s)` size table + hook in that family's builder (copy `makeGoblinModel3D`), point
`patch_game.py` at both asset folders, and rebuild the three html files + offline.
