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
| 5 | numpy + scipy | `bake.py out5k.bin 1024` | Smooth normals → box-projection UV charts (majority-vote smoothed, confetti merged) → skyline-packed 1024 atlas → colours splatted from the point cloud and hole-filled → region auto-rig (root / armL / armR / legL / legR, smooth-stepped weights) → quantised binary + JPEG atlas → `goblin_scout_asset.json`. |
| 6 | — | `patch_game.py <build.html> goblin_scout_asset.json` | Drops `gob_scout_code.js` (decoder + `makeGoblinScout3D`) in front of `makeGoblinVariantMesh`, hooks the `scout` role to it, appends the `<script id="imyala-goblin-scout" type="application/json">` data block, and applies the feet-on-the-floor fix to the enemy loop. Run it on `towerlords.html`, `towerlords-mobile.html` and `models-preview.html`, then `node .claude/build-offline.js`. |

## Binary layout (`goblin_scout_asset.json → geo`, base64)

`pos:u16×3 · uv:u16×2 · idx:u16×3 · nrm:i8×3 · skinIndex:u8×4 · skinWeight:u8×4` — the 2-byte arrays
come first so the typed-array views stay aligned. `h.min` / `h.scale` de-quantise positions into model
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

## Adding the next model

Drop the sculpt's OBJ+texture in `GameAssets/3dAssets/`, run steps 1–5 (tune the rig regions in
`bake.py` — `armW` / `legW` thresholds and the `bones` pivots are in model units, look at a top-view
slice plot first), give the asset its own `<script id>` and builder function, and hook the role in the
family builder the same way as `makeGoblinVariantMesh` does for `scout`.
