# TowerLords — July 2026 Overhaul

All changes live in `towerlords.html` (and are mirrored into `towerlords-offline.html`, rebuilt). `towerlords-mobile.html` is a separate fork and was NOT touched — port when ready.

## 1. The Beast → boss-drop relic forms
The 7th column is no longer a vertical point progression. Six exclusive **forms** (Wolf, Stag, Bat, Boar, Lion, No Longer Human) unlock by absorbing **Beast Relics** — a new item that drops from Tower Lords (30% per guardian, guaranteed from the final lord; only forms you don't own can drop). Right-click a relic to absorb it permanently (`META.beasts`). Only **one form is active at a time**; click a form in the tree to switch (`META.beastOn`). Each form was rebalanced to stand alone (Wolf's Scent of Fear is now +20%, was +12%). Old saves with points in the Beast column get those points auto-refunded on load. Quick-build ignores the column; refunds/invests can't touch it.

## 2. Skill tree UI fix
The "🔒 locked" text that rendered behind node icons is gone. Only the *next* attainable row shows its requirement, in a high-contrast chip (z-indexed above tiles, background pill); deeper locked rows just dim their tiles instead of the whole row (so labels are never swallowed by the row opacity).

## 3. Unique QUIRK nodes (less stat-repeat filler)
16 new engine-backed, one-point rule-benders are woven into the generated rows (2–4 per tree, rows ~4–22), replacing stat fillers. The filler generator's seed was also scrambled so adjacent rows stop repeating the same stat/icon.

- Vanguard: **Unmoved** (knockback immunity), **Payback** (+40% next hit after being struck), **Giant Slayer** (+20% vs elites/bosses)
- Striker: **Overkill** (excess kill damage erupts as a shockwave), **Culling Blade** (non-boss <8% HP dies), **Hubris** (+30% vs elites/bosses, +15% damage taken), **Desperado** (up to +15% crit as life falls)
- Mender: **Pacifist's Fury** (healing charges a gauge → next hit executes a non-boss), **Mending Shockwave** (heal flasks detonate a damage nova)
- Warden: **Arcane Thrift** (every 4th cast free), **Overdraw** (cast on missing mana with life)
- Ranger: **First Strike** (+35% first hit per enemy), **Slipstream Edge** (guaranteed crit after a dash), **Adrenaline** (hits taken restore 4% mana)
- Elementalist: **Resonance Cascade** (ailment-carrying kills detonate), **Frost Feed** (chilled kills restore 5% mana)

## 4. Projectile variety (RotMG-style)
New shot **silhouettes** via `boltGeo()`: arrow, blade, feather, bomb, wind crescent, star — with per-shape animation (arrows/wind orient to heading, blades/stars whirl, feathers flutter, bombs pulse). Used by player weapons, enemy bullets, and pets.

New **flight styles**: `zig` (hard zigzag jinks), `sling` (slingshot — flies out, snaps back through you, relaunches at your aim at 1.8× speed and 1.5× damage), player-side `fuse/blast` (shells that detonate on fuse, impact, or walls via `boltExplode`).

**5 new weapon archetypes** (drop naturally): Windcaller 🌬 (accelerating piercing crescent), Featherfan 🪶 (4 weaving feathers), Bombard 💣 (AoE shells), Pendulum ⛓ (slingshot star), Serpent 🐍 (zigzag twin arrows). Each has its own impact feel + sound. Existing weapons got fitting silhouettes (bow/spear/railgun=arrows, sword/daggers=blades, chakram/ricochet=stars, cannon=bomb).

**Enemy patterns**: 6 new presets (arrows, zigzag, scythes, feathers, bombs, crescents) mixed into all 7 shooter archetypes, and 4 new boss moves (SCYTHES, MOLT, SHELLS, GALE) wired into Bombard, Twin-Fang, Sweeper, Reaper, Summoner kits.

## 5. Pets
Two new born abilities in the 50-pool: **Bomber 💣** (lobs exploding shells, area damage scaling ~6+2/level) and **Frostbite ❄** (cold bolts that always CHILL — feeds elemental-reaction builds and Corpse Orchard/Frost Feed synergies).

## 6. Items
6 new uniques built on the new archetypes: Harpy's Regret (featherfan), Yulgor's Last Argument (bombard, +100% ignite), The Ninth Gale (windcaller), Kismet (pendulum), Sidewinder's Grin (serpent) — plus Beast Relics as a new drop class.

## 7. Audio
Two new procedural tracks: **feral** (boss set — loping 120bpm hunt) and **ashen** (floor set — dorian 92bpm). Fixed two silently-missing SFX that were referenced but never defined: `sfx.boom` (now a real detonation — used by bombs & heavy boss impacts) and `sfx.deny`. New weapons each have distinct fire sounds (wind whoosh, feather chirp, shell thump, pendulum clank, serpent zap).

## Verification performed
- `node --check` on the full extracted module: clean.
- Unit-evaluated the tree generator in Node: 7 specs, Beast column = 6 relic forms, 70 rows per tree, all 16 quirks placed (tk 3, st 4, mn 2, wd 2, rg 3, el 2), skill budget still maxes exactly one tree (548).
- Offline build regenerated from the new main file (importmap swap verified).

## Assumptions made
- Beast unlocks persist account-wide in META (not per-run) — relics are rare boss drops, so losing them on death would feel terrible.
- Relic drop chance 30% per lord (100% from the final lord), only rolls forms you don't own.
- "Hubris" penalty is a flat +15% damage taken (attack source isn't tracked at the hurt site).
- Mobile fork left untouched to avoid divergence damage; port the same edits when desired.

---

# WAVE 2 — "everything mentioned" systems pass

## Weaponized gold economy
**Throw Gold (G key)** — hurls a fan of coin-shots whose damage scales with your unspent purse (Disposable Income), and scatters coin lures at your aim. Nearby enemies drop everything and scramble for the coins; non-elites that grab one have a 45% chance to be **BRIBED** — they fight for you for 30 seconds. **Gold Plating (J key)** — spend gold on a coin shield; hits chip it away visibly. **Loot Vacuum (hold Y)** — drags every pickup on screen toward you, drains mana, and stops you attacking. **Counterfeiter** (Ranger keystone) — 20% of thrown coins are fakes that detonate whoever grabs them. **Midas Shrapnel** (Striker keystone) — kills burst into coins that melt in 3 seconds. **Greed** (quirk) — more gold and goblins, but everything aggros from further. **Grudgeholder** (quirk, the "Debt Collector" idea) — +50% vs anything that attacked you in the last 10s.

## Weapon overheat / shatter
Rapid kills heat your equipped weapon: past 30 heat it deals up to +42% damage and +28% attack speed… at 100 an **OVERHEAT fuse** starts — 5 seconds to stop killing, cool off, or swap weapons (swapping dumps 60% of heat) before it **permanently shatters to dust** (4 crafting shards as consolation). Heat bleeds off between floors.

## Scavenger ecosystem
Die (non-casual) and the nearest living mob **loots one equipped item off your corpse** and earns a name. Next run it stalks that floor as a ringed elite wearing your gear — kill it to get the item back. Walk past that floor without settling the score and it **migrates upward to serve the next guardian as a bodyguard**, fighting beside the lord with your stolen gear until you finally put it down.

## Death economy
**Dead Drop** — a quarter of your purse is crushed into the stones of the floor you died on; a gold cache spawns there next run. **Soul Debt** — after death, your next life earns +50% XP until the debt is repaid.

## Puzzles, wagers & sabotage
**Glyph Shrines** (62% of floors) — memorize a 4-glyph sequence, repeat it under a 12s timer while the floor stays live → +2 unallocated stat points (Raw Potential). Solve untouched → **Puzzle Master's Aura**: your next chest pays out extra. **Altar of Hubris** — wager 2–3 unspent stat points on a kill-count-in-35s challenge: double or ash. **Sabotage Lever** in every boss arena — flood it (slow the lord's moves) or collapse a pillar (delete one of its attacks). **Sealed Chests** (18%) — cost one stat point to unlock, repay with elevated loot. **Trap Scavenger** — press F over a dormant trap to dismantle it: +2% damage per trap this floor (max 5). **Mid-Combat Reflexes** — assigning a stat point during a boss fight heals 15% (once per guardian).

## Input-skill mechanics
**Right-click Parry** (keyboard move mode) — bats every enemy projectile within reach back toward your cursor at 1.5× damage, 1.1s cooldown. **Scroll-Wheel Overdrive** — spin the wheel up mid-fight for stacking attack speed (to +200%) that drinks mana every second. **Typing Cast** — press Signature without full charge and the tower demands a 4-letter word typed in 3.2 seconds; land it and the Signature fires on nerve alone (20s recharge). **WASD Afterimage** — every dash leaves a taunting decoy that pulls nearby enemies off you for a heartbeat.

## Goblins & stash
**Loot-Guzzling Goblin** — a green skulker that eats unclaimed drops: each meal makes it fatter, slower, tankier. If it swallows a rare or unique it **mutates** into a red hunter that eats *you*. Kill it any time to get every swallowed item back plus a gold bonus scaling with how fat you let it get. **Stash Goblin** — 20% of slain gold goblins surrender and move into your stash, converting your cheapest banked junk to gold (×1.3) each sanctuary visit. **Schrödinger's Stash** — flasks left banked reroll into a different flask type every floor. **Flea Market Flipper** — items appreciate ~1%/minute carried (to +50%) when sold at the vendor.

## Quirk wave 2 (all engine-backed, woven into the trees)
Kinetic Hoarder (+8%/idle-second stored, spent on next strike, cap +120%) · Phantom Strikes (misses stack into the next hit) · Momentum Siphon (crits steal Swiftness) · Blood Price (no crits — would-be crits permanently SHRED the target) · Vampiric Plating (overheal becomes an ablative ward) · Cursor's Curse (stare damage under your pointer) · Echolocation (+50% vs unaware enemies) · Vector Shift (perfect dodges compound move speed per floor) · Ricochet Rush (wall-dash resets dash) · Quantum Step (near-lethal hits teleport you behind the attacker) · Gravity Well (stillness pulls, motion pushes) · Heavy Sleeper (stand still 3s → untouchable, screen dark) · Trailblazer (burning footsteps ignite pursuers) · plus keystones Hoarder's Burden (+1% speed per empty slot), Cursed Covenant (+8% damage per cursed item worn), Soul Contract (guardians always drop uniques).

## Verification (wave 2)
`node --check` clean on the full module; tree generator unit-run: all 31 quirks place (tk 5 / st 8 / mn 3 / wd 3 / rg 9 / el 3), budget still one-tree (545); every new function defined once and referenced; offline bundle rebuilt from final source.

## Deliberately adapted or skipped (and why)
- **Stash Mimic** — the game has no "stash wiped on double death" rule to feed it; the Scavenger elite + Dead Drop cover the reclaim-your-losses fantasy instead.
- **Bargain Hunter** (unidentified vendor stock), **Midas Touch** (corpse barricades interfere with pathing), **Frictionless / Time Dilation / Shadow Step / Phase Shift / Elastic Tether / Leap of Faith** (movement-model rewrites), **Penny Pincher / Inflation** (anti-fun edge cases), **Cursor Blindness** (enemy vision model doesn't support it cleanly). Everything else from your lists is in, either literally or as a close engine-native variant.
