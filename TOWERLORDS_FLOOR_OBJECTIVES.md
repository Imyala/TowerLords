# TowerLords — Floor Objectives, Enemy Scaling & the Skill-Point Cap

---

## 1. Floor objectives

Every NORMAL floor now rolls one of ten objectives. Completing it is what opens the portal. Boss
floors still want the guardian dead; safe floors ask nothing. Floors 1–2 always roll Purge so the
default is taught before the tower starts getting inventive.

| | Objective | What it wants | Scaling |
|---|---|---|---|
| ⚔ | **Purge** | Kill ~70% of the floor's population | the old default, weight 20 |
| ☠ | **Extermination** | Kill *everything* — nothing respawns while it's active | weight 6 |
| ⏳ | **Endure** | Survive 55–105s while the tower keeps sending reinforcements every ~4–8s | +1.2s/floor |
| 🕊 | **Vow of Silence** | Damage *nothing* for 26–46s. Hitting an enemy restarts the count | +0.5s/floor |
| 🛡 | **Untouched** | Take no damage for 34–58s. One hit restarts the count | +0.6s/floor |
| 🎯 | **Marked for Death** | Kill 3–5 marked foes (red beacon, tougher, double XP). The rest may live | +1 at floors 15 & 32 |
| 💠 | **The Tithe** | Collect 8–18 tithe shards, dropped by ~42% of kills | +1 per 2 floors |
| 🧩 | **Sealing Ritual** | Stand at each of 3–4 glyph pylons for ~1.1s to seal it | +1 at floor 20 |
| ⬢ | **Hold the Ground** | Stand inside a marked circle for 18–34 cumulative seconds. Holding draws enemies in; stepping out drains the meter at half speed | +0.4s/floor |
| 📦 | **Plunder** | Open 3–4 caches (extra chests are guaranteed to spawn) | +1 at floor 25 |

**Rewards.** Every objective except Purge pays a completion bonus of `60 + floor×14` gold and
`120 + floor×10` fame, because they ask you to play differently rather than just play more.

**No floor can become unwinnable.** The two vow objectives (Vow of Silence, Untouched) track breaks.
On the third break the ritual collapses and the floor falls back to a plain Purge sized to whatever
is still alive. Everything else is either time-based or has guaranteed-spawnable props.

**Reshuffles keep your progress.** When the floor reshuffles mid-objective, `_G.objKeep` carries the
objective across: counters and timers survive, and `objSetupProps()` re-marks hunt targets, rebuilds
pylons and re-places the hold circle on the new layout. Purge/Extermination re-scale their remaining
requirement against the new population.

**HUD.** The line under the floor name shows the objective icon, name, a progress bar and a
counter/timer, with the full description on hover.

### Code map

| Function | Role |
|---|---|
| `FLOOR_OBJECTIVES` | the table above, with roll weights |
| `rollFloorObjective(rooms)` | called from `generateFloor`; rolls or carries over, then builds props |
| `objSetupProps(o, rooms)` | marks hunt targets, spawns pylons / hold circle / extra chests |
| `objTick(dt)` | timers, pylon channelling, ground-holding, pressure spawns |
| `objOnKill / objOnHitEnemy / objOnPlayerHurt / objOnChestOpened / objOnShard` | the five hooks |
| `objComplete / objBreak / objFallbackToPurge` | resolution |
| `objHudHTML()` | the HUD line |

---

## 2. Enemy scaling is now blind to *which* tree

Two changes, both aimed at letting a specialist feel like one.

**Scaling input.** `basePowerLvl()` now reads base attribute points **plus total skill-tree points**,
and does not care which column they went into:

```js
best = 1 + baseAttributePoints + totalTalentRanks
```

A 60-point tank, a 60-point damage build and a 60-point healer all present the same threat number.
Gear bonuses are still excluded, so finding good loot always makes you stronger rather than just
raising the bar.

**Archetype counters removed.** Enemies used to read your dominant specialisation and counter it
directly — tanks got stun-locked, speedsters slowed, healers mortally wounded. The harder you
committed to a role, the harder the tower punished you for it. `S.adaptKind` and `S.adaptLvl` are now
permanently null/zero, so `applyEnemyCounter()` never fires. The character sheet's "Dominant path"
row became "Tree investment — N / BUDGET points".

The underlying debuff plumbing (`G.stunT`, `G.slowT`, `G.weakT`, `G.healCutT`) is left intact, since
other systems still use those states.

---

## 3. Skill points stop at Level 255 — permanently

`skillGrantedByLevel(lv)` returns the **total** lifetime skill points a character should have been
granted by a given level, spread evenly across the climb:

```js
lv >= 255            → SKILL_BUDGET               (exactly one full tree)
otherwise            → 3 + round((SKILL_BUDGET-3) × (lv-1) / 254)
```

`doLevelUp()` grants the difference between that figure and what you have already received. Two
consequences:

- A single 1 → 255 climb hands out **exactly** `SKILL_BUDGET` points — enough to fully max one
  specialisation tree and not one point more. (Previously the curve was spread over 240 levels, so
  the budget ran dry early.)
- **Evolving does not reopen the tap.** The grant is explicitly zero for any character with
  `evolves > 0`, and `skillGranted` is already at the budget anyway. Evolution keeps handing you
  attribute points on every climb back up — your tree is finished the first time you hit 255.

The skill tree header now shows `Skill points: N · lifetime X/BUDGET`, and reads `COMPLETE
(evolutions grant no more)` once you are past the cap.

---

## 4. Map crystals

The floating octahedra that used to be free XP orbs no longer spawn at all. The `else` branch in the
scenery pass is gone, so those slots simply produce nothing.

---

## 5. Fixes and cleanup applied after the first pass

**Correctness**

- **Depth seal was single-player only.** `tickDepthSeal()` ran once per frame against whichever
  player the frame happened to be routed through, so in co-op only one character banked the depth.
  It now iterates every joined player — seals are per-character state.
- **Objective reinforcements could spawn inside walls.** `objPressureSpawn()` was offsetting from
  the hold circle by a raw ±15 units, which could land an enemy outside any room with `e.room` null
  and poison the respawn queue. Reinforcements now always resolve to a legal room tile, preferring
  rooms within 34 units of the zone.
- **The reshuffle carry-over flag could leak.** `_G.objKeep` is consumed when an objective is
  rolled, but a boss/safe/town regeneration never rolls one — so the flag could survive into the
  next floor and carry a stale objective with it. `generateFloor()` now force-clears it on exit.
- **Extermination had a second respawn path.** Only one of the two `G.respawns.push` sites was
  guarded. Both are now.
- **Vow objectives could break before you moved.** A lingering burn or poison from the previous
  fight would break Vow of Silence / Untouched three times in the first second and drop the floor
  straight to the purge fallback. Both now have a 2.5-second grace window at floor entry, and the
  announcement spells out what counts as harm — including toggle auras, which are called out by
  name (with a banner) if you have any running when the vow is rolled. Pet damage is exempt.
- **Controller focus was hunting for retired classes.** The gamepad menu cursor still looked for
  `.bagItem` / `.gearSlot` / `.islot`, none of which the current panels use. It now targets
  `.tile`, `.st` (sort chips), `.buyRow` and `.jq`.
- **Duplicate `roomCenter`.** A helper added for objective spawning already existed next to the
  other room helpers; the copy was removed.

**Cleanup**

- `applyEnemyCounter()` and its call site deleted — unreachable once `adaptKind` was pinned null.
- `SKILL_PER_LEVEL` and `KINDNM` removed (no remaining callers).
- The stash's old list-row CSS (`.invcol`, `.islot`, `.stashBtns`) removed with the markup it styled.
- `itemDetailEls()` simplified now that there is a single inspect pane.
- The pause menu listed "Inventory" and "Equipment" as two entries pointing at the same panel;
  they are one entry, both keys.

---

## 6. Tests

`bash tests/run.sh` — needs only node, no browser.

It extracts the inline game script from `towerlords.html`, syntax-checks it, loads it under a stubbed
DOM/WebGL/three.js environment (`tests/sandbox.js`), and then runs two suites:

- **`tests/unit.js`** — pure logic and static guarantees: the rank ladder, the fame curve, seal
  thresholds, the skill-point budget, objective tables and weights, sorting totality, the stash
  filter, screen bearings, plus regression guards (no typing-cast, no crystals, no `equipPanel`, no
  orphaned helpers, no duplicate top-level declarations).
- **`tests/integration.js`** — builds a real character with generated items and drives the actual
  code: every panel renders, the stash search box is built once, deposit/gear-only/retrieve respect
  the caps, all ten objectives set up and tick, survive/pylons/hold/tithe complete end to end, the
  evolution gate blocks in the right order and rebirths correctly, an evolved character earns no
  further skill points, a first climb to 255 lands on exactly one tree, and shift+click max-fill
  stops when points run out.

Both suites exit non-zero on failure, so they drop straight into a pre-commit hook or CI.
