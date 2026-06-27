# TOWERLORDS — Enemy Bullet Pattern Catalog

*Danmaku / bullet-hell pattern reference for enemy & boss attacks. Sourced from Touhou, Bullet Heaven 2, Realm of the Mad God, and Tiny Rogues, plus general danmaku theory.*

---

## How this maps to the code

Every pattern is a **preset of one generic emitter**, `emit(e, P)`, in `towerlords.html`. The relevant building blocks:

- **`eShot(x,z,ang,spd,dmg,opt)`** — spawns one bullet. Angle convention everywhere: `vel = (sin(ang), cos(ang))`, aim = `atan2(dx,dz)`.
- **`eVolley(x,z,base,cfg,dmg,opt)`** — one volley of `cfg.count` bullets (ring / arc-fan / fixed-separation / wall-gap / petal).
- **`emit(e, P)`** — schedules `P.waves` volleys over time; *aimed* patterns re-track the player each wave, *fixed* patterns lock the base angle and only `spin`.
- **`bPresets()`** — the named preset catalog.

**Per-bullet opt-in flags** (resolved in the `eProjectiles` update loop, so plain bullets are untouched):

| Flag | Effect |
|---|---|
| `wave:{amp,freq}` | perpendicular sine weave (sign alternates per bullet → braids) |
| `bounce:N` | reflect off walls N times |
| `accel` | speed change/sec along heading (+expand / −contract) |
| `turn`+`turnT` | homing toward nearest player, capped turn rate, then expires |
| `fuse`+`burst` | detonate into a ring at fuse time (airburst) |
| `gap` | skip the bullet aimed at the player (wall-with-gap) |
| `petalK`+`petalAmp` | bulge a ring into K lobes via per-bullet speed (flower) |

### Implementation status (catalog # → code)

| # | Pattern | Status | Where |
|---|---------|--------|-------|
| 1 | Single Aimed Shot | ✅ | preset `aimed` |
| 2 | Ring / Circle Burst | ✅ | preset `ring`, boss `mRing` |
| 3 | Aimed Spread / Fan | ✅ | presets `spread3`/`fan5`, boss `mFan` |
| 4 | Cross / Star Burst | ✅ | boss `mCross` (rotating 4-way) |
| 5 | Spinning Ring | ✅ | boss `mNova` (staggered gap-filling rings) |
| 6 | Spiral | ✅ | preset `spiral`, boss `mSpiral` |
| 7 | Multi-Arm Spiral / Windmill | ✅ | preset `arms`, boss `mArms` |
| 8 | Wall with Gap | ✅ | preset `wallgap`, boss `mWall` (`gap` flag) |
| 9 | Wave / Snake | ✅ | preset `weave2` (`wave` flag) |
| 10 | Random Spray | 🟡 | `jitter` param (no named preset yet) |
| 11 | Rain | ❌ | not implemented |
| 12 | Stream / Machine-gun | ✅ | preset `stream` (re-aims each wave) |
| 13 | Expanding / Contracting Ring | 🟡 | `accel` flag (no named preset yet) |
| 14 | Flower / Petal | ✅ | boss `mFlower` (`petalK` flag) |
| 15 | Rose / Spirograph | ❌ | not implemented |
| 16 | Bouncing | ✅ | preset `ricochet` (`bounce` flag) |
| 17 | Counter-Rotating Layers | ❌ | composable from two `arms` (CW + CCW) |
| 18 | Homing | ✅ | preset `homing`, boss `mSeekers` (`turn` flag) |
| 19 | Laser Sweep | 🟡 | boss `mBeamSweep` approximates with bullets; true beam ❌ |
| 20 | Whip | ❌ | not implemented |
| 21 | Grid / Lattice | ❌ | not implemented |
| 22 | Stack / Layered Volley | 🟡 | possible via `speedStep` (no named preset) |
| 23 | Orbiting Emitter | 🟡 | `spawnR`/`spawnStep` params exist |
| 24 | Airburst / Splitter | ✅ | preset `airburst` (`fuse`+`burst` flags) |
| 25 | Composite / Spell-Card | ✅ | boss rosters compose multiple moves |

**Not yet done (good next adds):** Rain (11), Rose/Spirograph (15), Counter-Rotating Layers (17), Whip (20), Grid (21), a true Laser beam (19).

---

## Conventions

- Angles in radians, `TAU = 2π`. `i` = bullet index in a wave; `w` = wave number; `t` = time; `dt` = tick delta.
- `aimAngle = atan2(playerY−srcY, playerX−srcX)` — emitter→player.
- A *wave/ring* = one discrete volley; a *stream* = one bullet per tick.

Two reusable helpers any spec should expose:
- `spawnRing(N, baseAngle, speed)` → `θ_i = baseAngle + i·TAU/N`.
- `spawnArc(N, centerAngle, spread, speed)` → `θ_i = centerAngle − spread/2 + i·spread/(N−1)`.

---

## TIER 1 — Trivial (single volley, fixed math)

### 1. Single Aimed Shot ("aimed bolt")
- **Emit:** one bullet straight at the player, on an interval.
- **Math:** `θ = aimAngle`.
- **Fairness:** brief muzzle flash; moderate speed so sidestepping works. The whole dodge is "don't stand still."
- **Signature:** universal — RotMG basic gods, the baseline twin-stick shot.

### 2. Ring / Circle Burst ("radial", "omnidirectional")
- **Emit:** N bullets evenly around a full circle, one volley.
- **Math:** `θ_i = baseAngle + i·TAU/N`. Set `baseAngle = aimAngle` to guarantee one bullet at the player.
- **Fairness:** fair by construction — angular gaps widen with distance, so back away. Lower N / slower = bigger holes.
- **Signature:** RotMG (nearly every god), Touhou fairies.

### 3. Aimed Spread / Fan ("shotgun", "spread")
- **Emit:** N bullets in a narrow arc centered on the player.
- **Math:** `θ_i = aimAngle − spread/2 + i·spread/(N−1)`; spread ≈ 30°–90°, N = 3,5,7.
- **Fairness:** odd N puts a bullet dead-on; dodge perpendicular. Clear "front," reads instantly.
- **Signature:** RotMG cubes/skulls, twin-stick grunts.

### 4. Cross / Star Burst
- **Emit:** ring with very low N (4 = cross, 5/6/8 = star), often re-fired with rotation.
- **Math:** Cross `θ_i = baseAngle + i·(TAU/4)`. The *gaps* are the feature.
- **Fairness:** huge gaps; trivial unless rotated (Tier 2).
- **Signature:** Bullet Heaven 2 minor enemies, Touhou "plus" fairies.

---

## TIER 2 — Simple (rotation, stacking across waves)

### 5. Spinning Ring ("rotating burst")
- **Emit:** a ring re-fired each interval, rotated a fixed step per wave.
- **Math:** `θ_i = w·spinRate + i·TAU/N`. If `spinRate` divides `TAU/N`, gaps line up into safe lanes.
- **Signature:** Touhou; the bridge between a static ring and a spiral.

### 6. Spiral ("single-arm spiral")
- **Emit:** one bullet per tick, each at a slightly larger angle → an Archimedean arm.
- **Math:** `θ_k = θ0 + k·Δ` (Δ ≈ 0.2 rad). All same speed → arm rotates rigidly as it expands.
- **Fairness:** single arm = lots of space; rotate *with* the arm to sit in the gap.
- **Signature:** Touhou (ubiquitous) — windmill/galaxy look.

### 7. Multi-Arm Rotating Spiral ("windmill")
- **Emit:** M arms at once, evenly offset; fire M bullets/tick.
- **Math:** arm `a`: `θ = θ0 + spinRate·t + a·(TAU/M)`. Equivalent to a ring whose `baseAngle` increments continuously.
- **Fairness:** M rotating safe corridors. Counter-rotate a 2nd layer for a "double helix" (#17). Highest value-per-line pattern.
- **Signature:** Touhou bosses, RotMG rotating-arm gods.

### 8. Wall with Gap ("curtain")
- **Emit:** a line/arc spanning a wide angle, with deliberate gap(s).
- **Math:** `θ_i = startAngle + i·Δ`, **skip** indices where `|θ_i − gapAngle| < gapWidth/2`. Move `gapAngle` per wave to force repositioning.
- **Fairness:** the gap *is* the fairness — ≥ player-width + margin; slow the wall so it's threaded, not dodged.
- **Signature:** Touhou "curtain" spells, vertical shmups.

### 9. Wave / Snake ("sine stream")
- **Emit:** a stream in a fixed direction whose *fire angle* oscillates sinusoidally → a slithering snake.
- **Math:** `θ_k = baseAngle + A·sin(ω·t_k + φ)` (A ≈ 0.5 rad). Alternative: straight spawn + per-bullet perpendicular `sin` wobble (S-curve).
- **Fairness:** predictable period; cross between crests. Phase-shift two for a braid.
- **Signature:** Touhou, Bullet Heaven 2 "wave" enemies.

### 10. Random Spray ("scatter")
- **Emit:** N bullets/volley with randomized angle and/or speed in a cone or circle.
- **Math:** `θ_i = centerAngle + rand(−spread/2, spread/2)`; optional `speed_i = rand(sMin,sMax)`.
- **Fairness:** variable speed desyncs clumps; keep density low (can't pattern-learn). Flavor/pressure, not a precision wall.
- **Signature:** RotMG mobs, Tiny Rogues, twin-stick swarms.

### 11. Rain ("downpour")
- **Emit:** bullets spawned across a line (top edge / band above the player), staggered in time.
- **Math:** `x = rand(xMin,xMax)`, `y = top`; `vel ≈ (jitter, +speed)`. Stagger spawn phases. Ground-marker telegraph for "meteor" variants.
- **Fairness:** vertical lanes between columns; weave horizontally.
- **Signature:** Touhou rain spells, arena bosses with falling hazards.

### 12. Stream ("machine-gun")
- **Emit:** one bullet/tick continuously aimed at the player's *current* position → a snaking rope that chases.
- **Math:** `θ = aimAngle` recomputed every shot. The player's motion bends it into a tail.
- **Fairness:** circle-strafe in one steady direction and the stream lags into a curve you stay ahead of. Stopping = death — teaches constant motion.
- **Signature:** RotMG signature aimed streams, Touhou aimed-needle spam.

---

## TIER 3 — Intermediate (parametric curves, motion changes)

### 13. Expanding / Contracting Ring ("pulse")
- **Emit:** a ring whose bullets accelerate/decelerate so the radius pulses.
- **Math:** ring angles as #2; per-bullet `speed(t) = s0 + accel·t`. "Slow then fast": start near 0, accelerate after a delay.
- **Fairness:** the pause-then-launch is the telegraph. Concentric pulses create breathing windows.
- **Signature:** Touhou, boss "shockwave" pulses.

### 14. Flower / Petal ("n-petal")
- **Emit:** a spinning ring whose per-bullet speed is modulated by a sinusoid of the bullet angle → petals.
- **Math:** `θ_i = baseAngle + i·TAU/N` (+ `w·spinRate`). `speed_i = sBase + sAmp·|sin(k·θ_i/2)|`, k = petal count.
- **Fairness:** symmetric and readable; safe pockets between petals. Slow it for a "blooming" look.
- **Signature:** Touhou flower spells, Bullet Heaven 2 floral bosses.

### 15. Rose / Spirograph ("rhodonea")
- **Emit:** stream bullets whose *spawn position* traces a rose curve `r = cos(kθ)`, firing outward.
- **Math:** sweep `θ(t) = θ0 + ω·t`. `r = R·cos(k·θ)`. Spawn at `(srcX + r·cosθ, srcY + r·sinθ)`, velocity radial-outward. **Maurer rose:** step θ by a large fixed degree (≈71°) for the lattice look.
- **Fairness:** visually dense but deterministic; gaps large mid-petal. Low emission rate — showpiece, not pressure.
- **Signature:** Touhou showpiece danmaku — the iconic "this is a bullet hell" screenshot.

### 16. Bouncing ("ricochet")
- **Emit:** ordinary bullets that reflect off walls instead of despawning, optionally a fixed bounce count.
- **Math:** on wall hit, `vel' = vel − 2·(vel·n)·n`. Decrement `bounces`; despawn at 0.
- **Fairness:** first bounce telegraphed by approach angle; cap bounces and fade color/alpha as they deplete.
- **Signature:** Tiny Rogues ricochet rooms, walled twin-stick arenas.

### 17. Counter-Rotating Layers ("weave")
- **Emit:** two multi-arm spirals together, one CW, one CCW.
- **Math:** A: `θ = θ0 + spinRate·t + a·TAU/M`. B: `θ = θ0 − spinRate·t + b·TAU/M`. They cross into a moving diamond lattice.
- **Fairness:** intersections are danger; the drifting *cells* between are safe. Tune M & spinRate so cells > player.
- **Signature:** Touhou advanced spells — the classic "lace" look.

---

## TIER 4 — Advanced (per-bullet state, targeting, special bodies)

### 18. Homing ("seekers")
- **Emit:** bullets that steer toward the player after launch, with a capped turn rate.
- **Math:** each tick `θ_target = atan2(py−by, px−bx)`; `θ += clamp(angleDiff, −turnRate·dt, +turnRate·dt)`. Expire homing after `tHome` so it goes straight (the escape window).
- **Fairness:** cap turn so circle-strafing outpaces it. Few homing bullets, never a swarm.
- **Signature:** RotMG homing gods, Touhou missiles, Tiny Rogues seekers.

### 19. Laser Sweep ("rotating beam")
- **Emit:** a persistent beam that sweeps; a thin *warning* line first, then the live beam.
- **Math:** ray from emitter at `θ(t) = θ0 + sweepRate·t`. Hit if perpendicular distance to the ray `< beamWidth/2 + playerRadius` **and** player on the forward side. Telegraph at low alpha for `tWarn` first.
- **Fairness:** the warning line is mandatory — lasers are instant-hit, so fairness lives entirely in the telegraph.
- **Signature:** Touhou boss lasers, RotMG laser bosses, Tiny Rogues beams.

### 20. Whip ("lash")
- **Emit:** a chain of bullets fired in sequence so they form a line that *cracks* across an arc.
- **Math:** bullet `i` fires at `t_i = i·delay`, angle `θ_i = startAngle + sweep·(i/(N−1))`, speed increasing toward the tip `speed_i = sBase + sStep·i`. Staggered launch + rising speed → whip from base to tip.
- **Fairness:** base moves slowly (readable wind-up); the tip is fast but thin — be off the swept arc or behind it.
- **Signature:** Touhou sweeping spells, melee-boss tail attacks.

### 21. Grid / Lattice ("checkerboard")
- **Emit:** bullets on a regular grid, released together (or in checkerboard phases).
- **Math:** spawn `(x0 + col·gx, y0 + row·gy)`; slow common velocity. Checkerboard: release cells where `(row+col+w) mod 2 == 0`.
- **Fairness:** spacing `gx,gy` is the safe-lane width — keep > player. A positioning puzzle, not a reflex test.
- **Signature:** Touhou puzzle spells.

### 22. Stack / Layered Volley ("burst stack")
- **Emit:** several rings/fans on the *same frame* at staggered speeds → concentric layers that separate.
- **Math:** layer `l`: ring with `speed_l = sBase + l·sStep`. Add `baseAngle += l·offset` to twist each.
- **Fairness:** telegraphs as one big burst, resolves into spaced rings — gaps between *layers* are the windows. "Panic then breathe" rhythm.
- **Signature:** Touhou, RotMG multi-shot bursts.

### 23. Orbiting Emitter ("satellite")
- **Emit:** bullets emitted from a point orbiting the emitter, so each volley's *origin* moves.
- **Math:** origin `(srcX + R·cos(φt), srcY + R·sin(φt))`, `φ(t)=φ0+ωt`. Fire aimed or radial from there.
- **Fairness:** reads as a swirling source; predictable once the orbit period is learned.
- **Signature:** Touhou orbiting familiars, RotMG bosses with orbiting minions.

### 24. Conditional Split / Airburst ("cluster")
- **Emit:** a bullet that, on a trigger (timer/distance), despawns and spawns a sub-pattern at that point.
- **Math:** parent travels straight; at `t = tFuse` (or `dist > d`) spawn `spawnRing(N, …)` at its current position, then kill the parent. Recurse ≤ 2 levels for fireworks.
- **Fairness:** the travel phase telegraphs *where* it bursts; flash before detonation.
- **Signature:** Touhou cluster spells, twin-stick splitters, RotMG bomb-shots.

### 25. Composite / Spell-Card ("phase pattern")
- **Emit:** two+ of the above layered with phase offsets — e.g. slow ring (area denial) + aimed stream (pressure) + occasional spiral. How real bosses are built.
- **Math:** independent emitters on their own clocks sharing `srcPos`.
- **Fairness — the golden rule:** **never make every layer require precise dodging at once.** One layer defines safe space (slow, geometric); another applies pressure (aimed).
- **Signature:** every Touhou spell-card, RotMG god combos, Tiny Rogues elite kits.

---

## Cross-cutting fairness principles (apply to all)

1. **Telegraph before instant-hit attacks.** Lasers (#19) and airbursts (#24) need a warning for `tWarn ≈ 0.3–0.8s`.
2. **Speed buys readability.** Slow + dense = danmaku puzzle; fast + sparse = twin-stick reflex. RotMG/Tiny Rogues lean fast-and-sparse; Touhou leans slow-and-dense. Pick per enemy.
3. **Gaps scale with distance.** Radial patterns (#2, #5, #7) are auto-fair — reward backing off.
4. **One bullet at the player, the rest as spectacle.** `baseAngle = aimAngle` engages the player without every bullet threatening.
5. **Density budget.** Track "bullets that can hit the player in the next 0.5s." Keep that bounded; the rest is theatre. **This is the key lesson for the 1–8 player co-op goal — patterns must stay legible in a crowd: favor large, slow, arena-spanning shapes over dense local spreads, and scale boss HP/density to headcount.**
6. **Rotation rhythms must be learnable.** For #5–#7, #17, pick `spinRate` so safe corridors move at a walkable, periodic pace.

---

## Sources
- [Sparen's Danmaku Design Studio — angle types, rings, spirals, density](https://sparen.github.io/ph3tutorials/ddsga2.html)
- [Sparen — Bullet Density Guide](https://sparen.github.io/ph3tutorials/ddsga4.html)
- [Touhou Wiki — Danmaku](https://en.touhouwiki.net/wiki/Danmaku)
- [npaka — 15 Bullet Hell Patterns](https://note.com/npaka/n/n5d38b7d84173?hl=en)
- Game-specific signatures (RotMG aimed streams/rings, Tiny Rogues homing/ricochet, Bullet Heaven 2 waves) from those games' established enemy/boss behaviors.
