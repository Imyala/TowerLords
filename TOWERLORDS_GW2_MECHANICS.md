# TowerLords — GW2 Mechanics Worth Stealing

*Reference notes on Guild Wars 2 systems, mapped to what TowerLords already has.*

*Status: §1-22 are all implemented in `towerlords.html` (and mirrored into the mobile and offline
builds). Each section's original "Steal" pitch is kept for context, followed by an "Implemented"
line naming the actual functions/constants — this file is now a map of the code, not a wishlist.*

---

## 1. Dynamic Level Adjustment (DLA)

GW2 scales an overleveled character *down* to `floor_max_level + 1` when they visit a low-level
zone, so early content never trivializes. TowerLords currently has the opposite problem covered
(higher floors already outscale the player), but nothing handles the reverse case: a high-evolution
character revisiting early floors for co-op, dailies, or helping a new party member.

**Steal:** an effective-level scalar applied to a character's derived attributes (not their base
stats) whenever their evolution/level exceeds a floor's intended band, shown as a HUD indicator the
same way GW2 shows a green down-arrow next to the actual level. Keeps low floors meaningful for
farming/co-op instead of being one-shot by a maxed character, and keeps the underlying character
sheet untouched — only the scaled view changes.

**Implemented:** `dlaFloorBand()`/`dlaEffectiveLevel()`/`dlaIsScaled()` compute the band and readout;
`dlaRewardMult()` (applied in `gainXP()` and per-kill gold) tapers rewards down to a 35% floor instead
of touching combat stats, preserving the "specialists feel OP" pillar. The `#dlaTxt` HUD span shows the
green-arrow effective level.

## 2. Combo fields & finishers

GW2's combo system: a **field** skill lays down an area effect (fire, water, poison, etc.), and a
**finisher** skill (projectile, blast, leap, whirl) that passes through it triggers a bonus effect —
e.g. a projectile through a fire field ignites, a blast through a water field heals nearby allies.
Up to 5 combatants can combo off one field.

TowerLords already has elemental reactions (fire/cold/lightning → ignite/chill/shock), but those are
skill-vs-status interactions, not skill-vs-skill-vs-area. A proper field/finisher layer would sit on
top:

- Tag existing AoE skills (fire pools, ice patches, storm zones) as **fields**.
- Tag existing skill types (projectiles, dash/leap skills, spin attacks) as **finishers**.
- Field × finisher lookup table produces bonus effects (e.g. projectile + fire field = burning bolts,
  leap + storm field = shock nova on landing).
- Cap concurrent comboers per field so it rewards timing, not just AoE stacking.

**Steal:** this is the single most "TowerLords-native" system on this list — it's a natural extension
of the existing elemental reaction table, not a new subsystem.

**Implemented:** `comboField()`/`comboFieldAt()`/`COMBO_TABLE`/`comboOnHit()`/`comboLeapAt()`, capped at
`COMBO_MAX_COMBATANTS`. Three field types exist: `fire` (Toxic Cloud, Napalm), `water` (Aegis Ward —
heals + grants Barrier on a leap combo), and `smoke` (Personal Shield — applies a chill-style effect).
Finishers: every `fireBolt()` projectile defaults to `'projectile'`; Nova/Mortar/Meteor are `'blast'`;
Whirl is `'whirl'`; Blink (and its evolutions) is `'leap'`.

## 3. Effect taxonomy (boons / conditions / control effects)

GW2 splits status effects into three buff/debuff categories plus consumables:

- **Boons** — positive, always removable (e.g. might, protection).
- **Conditions** — negative, always removable (e.g. burning, chill).
- **Control effects** — movement/skill-disabling, broken only by stun-break skills (stun, daze, knockdown).
- **Nourishments / Enhancements** — timed consumable buffs (food vs. utility potions), stacked
  separately from combat boons.

TowerLords has ignite/chill/shock (conditions) and flasks (consumables) already. What's missing is a
**control-effect category** that's distinct from damage conditions — stuns/knockdowns that specifically
require a "stun break" skill or trait to clear early, rather than just expiring or being cleansed like
a condition. Formalizing this into three buckets (boon / condition / control) makes future skill design
and UI (a dedicated effects-monitor row) a lot cleaner than ad hoc status flags.

**Steal:** control effects as a distinct, stun-break-only-clearable category; a small "boons" bucket
for positive party buffs (currently folded into generic buffs).

**Implemented:** Dash is now a stun-break skill — `doDash()` clears `G.stunT` outright (unlocking the
`stunbreak` feat) instead of just being unaffected by it, distinct from how cleanse/Purify still clears
ordinary conditions.

## 4. Damage type breakdown

GW2 separates damage into: **strike** (crit-capable, mitigated by armor), **condition** (damage-over-time,
no crit, ignores armor), **lifesteal** (paired healing, ignores most modifiers and armor), and
**falling** (environmental, unmitigated, can outright defeat).

TowerLords' elemental/physical split already covers most of strike vs. condition. Two gaps:

- **Lifesteal damage** as its own math path (flat, non-crit, armor-ignoring) rather than a percent-of-damage
  leech modifier riding on strike damage — matters once damage-reduction stacking gets deep, since a
  leech-on-strike build should still heal even against high-armor targets.
- **Falling damage** isn't really a fit for a top-down/arena climber, but the general pattern —
  unmitigated, bypasses damage reduction entirely — is reusable for hazard tiles (lava, spike traps).

**Steal:** lifesteal as its own damage path; "unmitigated" as a damage flag reusable for environmental
hazards.

**Implemented:** `hurtEnemy()`'s lifesteal calc divides out `G.S.critMult` before applying the lifesteal
percentage, so crits no longer over-heal. `hurtPlayer(dmg, {unmitigated:true})` bypasses armor/ascension/
difficulty/every reduction keystone; used by the lava hazard tick and by the hazard-knockback synergy
(§21 below).

## 5. Mastery system (account-wide, post-cap progression)

Masteries are permanent, **account-wide** unlocks trained after hitting the level cap: gated behind
(a) enough accumulated XP in a track and (b) mastery points earned from achievements/exploration, spent
to permanently unlock the trained track. Distinct regions (per-expansion) have their own mastery-point
currency, so points from one region can't buy masteries in another.

TowerLords' Evolution System + Ascendant Seals is already the closest analog (per-life gate, account-
sticky rank) but it's a *rebirth* mechanic, not a parallel unlock track. A mastery-style layer would be
account-wide, additive, and never reset by death or evolving:

- Post-cap (or post-first-evolution) characters earn a secondary XP track from floor exploration.
- Spend it + biome-specific "insight" currency (found via floor secrets/hero-challenge-equivalents) on
  permanent QoL/traversal unlocks — e.g. faster dash, minimap reveal, auto-loot radius, biome hazard
  resistance — scoped per biome so a Yellow-biome insight can't buy a Red-biome unlock.

**Steal:** a permanent, non-resetting, biome-scoped unlock currency layered on top of (not replacing)
the Evolution/Seals rebirth loop.

**Implemented:** `MASTERIES`/`gainInsight()`/`checkMasteries()`, banked in `META.insight` (per biome
index) and unlocked flags in `META.masteries` — awarded on every floor clear (`objComplete()`) and now
also from Hero Challenges (§17). Mastery effects fold into `recompute()` alongside gear/talent mods, and
one mastery reduces lava hazard damage via `masteryHazardResist()`.

## 6. Achievements & achievement-point rewards

Achievements are account-wide, mostly one-time, and hand out achievement points that themselves ladder
into reward tiers (every 500 points → a reward chest; every 5,000 → a title). Meta-achievements act as
umbrella trackers over a category.

TowerLords already has Feats/achievements. The gap is the **point-ladder reward layer** — points as a
secondary currency with their own tier rewards (cosmetics, titles, stash space) independent of what
each individual achievement grants, plus meta-achievements that roll up a category (e.g. "clear all
6 biomes' floor bounties") into one umbrella completion.

**Steal:** achievement points as a secondary account currency with its own reward ladder; meta-achievements
as category umbrellas.

**Implemented:** `unlockFeat()` now also grants `META.apts` (≈fame/100); `checkAchvRewards()` pays out
at 100 points then every 500, and stamps an account rank readout every 5,000. `META_ACHIEVEMENTS` +
`checkMetaAchievements()` roll up the floor-milestone and rescue feats into two umbrella completions.

## 7. Specializations / traits (adept–master–grandmaster tiers)

Each GW2 spec has 12 traits (3 minor, auto-active; 9 major, 3-per-tier choice across adept/master/
grandmaster), and only 3 of a profession's specs can be slotted at once — one of which must be the elite
spec if equipped, and it always occupies a dedicated slot.

TowerLords' skill tree rework (see `TOWERLORDS_SKILL_TREES.md`) already mirrors this shape closely —
lane openers/core/power/notable/keystone is functionally the adept→grandmaster tier ladder. The one
GW2 idea not yet present: **minor traits that are always-on the moment a lane is entered**, independent
of which major nodes are purchased — a small always-active bonus for committing to a lane at all, on
top of the point-bought majors. Cheap to add, reinforces "picking a lane" as a decision in itself.

**Steal:** a free, always-on minor bonus per lane, orthogonal to the point-spent major nodes.

**Implemented:** in `recompute()`, the moment any rank sits anywhere in a lane, that lane's row-1
opener effect is granted a second time for free, on top of whatever ranks were actually bought —
verified to stay lane-isolated (a point in one lane never triggers a neighboring lane's bonus).

## 8. Elite specializations (mechanic-altering, weapon-unlocking)

Elite specs don't just add traits — they swap out or expand the profession mechanic entirely and unlock
a new weapon type, gated behind fully training the core tree first and costing far more points (250 vs
60). Only one can be equipped, always in a reserved slot.

This maps well onto TowerLords' companion evolution / relic-unlocked "Beast" forms already noted in the
skill-tree doc. **Steal:** treat a subset of high-tier unlocks (Beast forms, or a future weapon-swap
system) as reserved-slot, mechanic-altering picks rather than just bigger numbers — they should change
*how* a build plays, not just its stats.

**Implemented:** `beastDashProc()` — the single active Beast Form now changes what Dash *does* (Wolf
marks the nearest foe, Stag refunds half its cooldown, Bat sips life, Boar braces for the hit, "No
Longer Human" makes the dash itself deal damage), not just passive stat bonuses.

## 9. Weapon skills vs. slot skills, unlocked by level

GW2 splits the bar into weapon skills (fixed per weapon, always available once the weapon is equipped)
and slot skills (heal/utility/elite, purchased individually with hero points, unlocked in sequence at
specific levels: 11, 15, 19, 31). Weapon-skill cooldowns tick even while the weapon is stowed/swapped.

TowerLords already has 3 bound actives + ultimate. The specific idea worth lifting: **background cooldown
ticking** — if a future weapon-swap or stance system is added, swapped-out skills should keep cooling
down rather than freezing, so swapping isn't a pure cooldown-reset exploit.

**Steal:** cooldowns tick regardless of whether the skill is currently "equipped"/active, once any
skill-swapping mechanic exists.

**Implemented:** `slotSwap()` — a skill's remaining cooldown now travels with the item (`item._cd`)
across `bindSkill()`/`unbindSkill()`/`autoBind()` instead of resetting per slot index, and unbound gems
keep cooling down in the bag (ticked alongside `G.cd` in `updatePlayerStep`). Closed a real exploit: you
used to be able to swap a still-cooling skill into an empty slot for an instant reset.

## 10. Attribute taxonomy (primary / secondary / derived / profession-specific)

GW2 cleanly separates:

- **Primary** (Power, Toughness, Vitality, Precision) — scale automatically with level.
- **Secondary** (Ferocity, Condition Damage, Expertise, Concentration, Healing Power) — gear/trait-only,
  base 0.
- **Derived** (Armor, Health, Crit Chance, Crit Damage, Condition/Boon Duration) — computed from the
  above via fixed conversion rates (e.g. 15 Ferocity = 1% Crit Damage).
- **Profession-specific** (one extra attribute per class, trait-gated only — e.g. Elementalist attunement
  recharge, Necromancer life force pool).

TowerLords has 5 core attributes already; formalizing a primary/secondary/derived split (with fixed,
documented conversion rates like GW2's "15 Expertise = 1% condition duration") makes the hero panel
easier to reason about and gives itemization room to add secondary-only stats later without touching
the primary four. A **role-specific attribute per class/role** (mirroring GW2's per-profession stat) is
a clean way to make the six Vanguard/Mender/Striker/Ranger/Elementalist/Warden roles from the skill-tree
rework feel more mechanically distinct, not just thematically.

**Steal:** documented fixed conversion rates for derived stats; one role-specific attribute per class,
trait-gated only (never on gear), matching the skill-tree roles.

**Implemented:** `ROLE_ATTR` — one stat per role (Vanguard→armor, Mender→life regen, Striker→crit
damage, Ranger→attack speed, Elementalist→skill damage, Warden→cooldown reduction), scaling with the
*fraction* of that spec's tree spent, gated purely by `specSpent()`/`specTotalRanks()` and never
obtainable from gear. The primary/secondary/derived split above is documented directly in code next to
`ATTR_INFO`.

---

## 11. Crafting — discovery & production

GW2 splits crafting into two phases: **discovery** (drag candidate materials into a mixing pane; the
game narrows down which undiscovered recipes they could belong to, greying out combinations above your
crafting level) and **production** (once discovered, queue up copies — each queued item crafts in half
the time of the one before it, down to a floor). Raw materials are tiered (Tier 1 Bolt of Jute → Tier 7
Bolt of Damask for cloth, and parallel tiers for leather/metal/wood/wool), and disciplines share a
material vocabulary so a Weaponsmith and an Artificer both reach for the same ingots.

TowerLords has no crafting discipline system at all today — gearing is loot/vendor/reforge-driven (see
`reforgeCostFor()`, gem sockets). The closest existing hook is the **craft station** already referenced
in the world (`G.craftStation`, `nearCraft`), which currently isn't backed by a recipe system.

**Steal:** a real discovery-then-production loop hung off the existing craft station — tiered materials
(reuse the FEATS-style flat unlock pattern: crafting tier gates recipes the way `tierGateNeed` gates
skill-tree rows), a discovery pane that narrows candidate recipes as materials are added, and a
production queue where the Nth queued item crafts faster than the (N-1)th, capped at some floor.

**Implemented:** `RECIPES` + `craftDiscoveryCandidates()`/`craftDiscoveryMatch()` (the narrowing engine)
+ `attemptDiscovery()` (the bench-UI trigger — unlocks the first recipe your current materials already
satisfy) + `queueCraft()`/`tickCraftQueue()`/`craftQueueTime()` (production, floored at
`CRAFT_MIN_TIME`), all surfaced in `renderCraft()`.

## 12. Upgrade components — infusions, enrichments, glyphs

GW2 upgrade components slot into equipment: **runes** (armor only, tiered bonuses that scale with how
many of the same rune you're wearing), **universal upgrades/sigils** (weapons, trinkets), **infusions**
(ascended/legendary gear + some back items, recoverable via a dedicated extraction tool), **enrichments**
(ascended/legendary amulets only), and **glyphs** (gathering tools only, freely swappable with no
destruction). Everything except glyphs destroys the previous upgrade when replaced, unless you have a
high-tier salvage kit or extraction device.

TowerLords already has the shape of this — `GEMS`/`makeGem()` gives 7 socketable gem types with tiered
mods (`mods:{dmgPct:6}` scaling `×(1+(tier-1)*0.4)`), and equipment carries a `sockets`/`socketed` array
read in `recompute()`. What's missing is the **tiered-destruction-vs-freely-swappable split**: today all
socketing presumably behaves the same way regardless of gem type. GW2's rule is worth adopting almost
verbatim — most upgrades are a one-way slot (replacing destroys the old gem, recoverable only via a
dedicated high-tier tool), while ONE category (glyphs) is always free to swap.

**Steal:** classify the 7 gem types into "destructive to replace" (the current default) vs a new
freely-swappable subtype for gathering/utility-flavored gems (Emerald/Amethyst are decent candidates —
utility stats rather than combat stats), plus a dedicated high-tier salvage/extraction item that recovers
a socketed gem instead of destroying it (today's basic salvage presumably always destroys).

**Implemented:** turned out normal gem sockets were *already* fully non-destructive (`wireSockets()`
always returns the removed gem to your bag) — more generous than GW2's default, so nerfing that to add
a "destructive" tier would have been a regression. Instead added **Infusions** (`INFUSIONS`/
`makeInfusion()`), a genuinely new Ascended-only socket row (`infSockets`/`infSocketed`) that — unlike a
normal gem — can *only* be recovered via `extractInfusion()`, which costs materials at the bench. That's
the real destructive-vs-freely-swappable split, without touching the existing generous gem system.

## 13. Ascended equipment tier

GW2 slots **Ascended** quality between Exotic and Legendary — same stats as Legendary, but bound and
non-swappable-stat, unlocked at character level 255 (the level cap), account-bound, and salvageable with
a dedicated tool for account-wide crafting materials used in *further* ascended/legendary crafting. It's
explicitly the "long-term BiS grind" tier — a destination, not a random drop table entry.

TowerLords' rarity ladder (`RARITY`: Common → ... → Uniques at `mult:9`) tops out at Uniques, and
`LEVEL_CAP=255` already exists as a meaningful threshold (it's the evolution gate). There's no tier that
specifically unlocks AT the level cap the way Ascended does.

**Steal:** a rarity tier above Unique, unlockable only at `G.level>=LEVEL_CAP` (mirroring GW2's account
level-255 gate), account-bound, with its own salvage-only material — dovetails naturally with the
Evolution System's existing "hit 255, then something special happens" beat instead of duplicating it.

**Implemented:** `ASC_RAR` sits outside `RARITY[]` like `UNIQUE_RAR`/`ABN_RAR` already did (so every
`RARITY.indexOf()===-1` junk/sort guard exempts it for free). Gated behind `LEVEL_CAP` in both
`makeItem()`'s drop table and `doAscend()`'s bench promotion (Unique/Legendary → Ascended, mutating the
item in place like `doReforge`/`doEnhance` do). Its own salvage material is `ambrosia`.

## 14. Attribute prefix system (offense/defense/support percentage split)

GW2 gear prefixes (Berserker's, Cleric's, Celestial, Trailblazer's, ...) are each a fixed percentage
split of a stat budget across three buckets — offense (Power/Precision/Ferocity), defense
(Toughness/Vitality), support (Healing Power/Concentration) — plus condition damage/expertise folded
into offense or defense depending on the prefix. Over 40 named prefixes exist, from pure one-bucket
(Berserker's: 100% offense) to even 4-way splits (Celestial: 33/22/22/22).

TowerLords' `AFFIXES`/`AFFIXMAP` (15 affixes + specials) are rolled independently per gear slot rather
than as a named, fixed-ratio bundle — closer to Diablo-style independent affix rolls than GW2's named
prefix system. This is a legitimate different design choice (independent rolls give more build
diversity per item), not obviously a gap to close, but a middle ground is easy to add without disrupting
the existing affix roll table.

**Steal (optional, lower priority than the others):** a small set of named "prefix bundles" — e.g. a
Unique-tier item could roll a themed prefix (all offense, all defense, or a Celestial-style even split)
instead of independent affixes, giving loot recognizable "builds in a box" the way GW2's prefixes do,
without touching the core independent-affix system most gear already uses.

**Implemented:** `PREFIX_BUNDLES` + `AFFIX_BUCKET` (which stat bucket each affix key leans into) +
`rollPrefixBundle()`, applied only to Ascended drops (`makeAscended()`) — Common through Legendary still
roll independently, untouched. Verified statistically to actually bias toward its bucket, not just carry
a cosmetic name.

## 15. Consumables taxonomy

GW2 organizes single-use items into named categories: **Nourishment** (Food — flat/percentage stat
buffs, contributes to the "All You Can Eat" achievement), **Enhancement** (Maintenance Oils/Potions/
Sharpening Stones/Tuning Crystals/Writs — utility-slot consumables, usually proportional bonuses),
**Boosts** (temporary account-wide benefits from the Gem Store or rewards), **Tonics** (cosmetic
transformations), and **Containers** (open into other items). Food and Enhancement stack independently
(one of each active at a time) rather than competing for the same buff slot.

TowerLords already has this shape via `FLASKS` (3 belt-slotted flask types) and stat potions mentioned in
`TOWERLORDS_ROADMAP.md`. What's not yet formalized is the **independent-stacking rule** — GW2's
food-and-utility-consumable-don't-compete pattern is worth confirming/enforcing explicitly if flasks and
potions currently share a single buff slot, plus a lightweight **container** consumable type (open →
guaranteed contents) as a vendor/reward sink distinct from random drops.

**Steal:** verify flasks (combat) and a hypothetical future "nourishment" (non-combat, sanctuary-bought)
consumable don't fight for the same buff slot; add a `Container` item type that opens into fixed/weighted
contents, reusing the existing loot-roll code path rather than inventing a new one.

**Implemented:** `makeContainer()`/`openContainer()` spills 1-3 items via the same loot-spill pattern
`openChest()` already uses, just at the player's feet instead of a world prop. `makeRation()`/
`useRation()` grants a flat 60s gold/XP buff (`G.rationT`) — verified to run *simultaneously* with an
active flask rather than overwriting it, proving the independent-buff-slot rule actually holds.

---

## 16. Vista

A vista is an interactive world object — a column of light with a floating scroll — that triggers a
cinematic when reached, rewarding exploration with a moment of spectacle rather than loot.

TowerLords had no camera system beyond a rigid fixed-offset follow-cam (`camFocus` tracked every frame
in the render loop) and no free/scripted camera path anywhere in the codebase.

**Implemented:** `spawnVista()` drops a beam+scroll prop per floor (not guaranteed every floor — a
scenic treat, not clutter). `triggerVista()` pauses the sim (`_G.paused`, `acquireInvulnLock()`) and
starts `G.vistaCam` — an orbit target consumed at the *top* of the render loop's camera-update block,
short-circuiting the normal follow-cam for a smoothed-ease orbit around the vista point, then
`endVistaCam()` restores normal play. Pays a one-time fame bonus the first time each exact vista is
found, via the existing `META.codex` primitive.

## 17. Hero Challenges

Hero Challenges are map tasks (combat, group combat, a consumable item, communing, dialogue, or a
minigame) that reward Hero Points, spent on training skills and traits — available account-wide from
level 11 on.

TowerLords' skill-point budget (`SKILL_BUDGET`) is deliberately fixed at exactly 93 — enough to fully
allocate one tree by level 255, and no more, ever. A world prop that granted skill points would break
that invariant outright.

**Implemented:** `spawnHeroChallenge()` (a communing-style prop) + `useHeroChallenge()`, which grants
biome-scoped **Mastery Insight** (§5's `gainInsight()`) instead of skill points — the same account-wide,
non-resetting currency a floor-clear already banks, just from a dedicated landmark instead. Verified to
never touch `G.skillPts`/`G.skillGranted`.

## 18. Point of Interest

A PoI is a named location that, on first arrival, shows a discovery message and awards experience,
contributing to a zone's completion percentage.

TowerLords had no per-floor "visited" or "discovered" concept at all — only a permanent, account-wide
bestiary flag (`META.codex`, via `discover()`) with no notion of partial completion.

**Implemented:** `spawnPOI()` drops 1-3 landmark props per floor; walking within range (no interact key
needed, matching GW2's passive discovery) marks it found, grants first-visit XP, and tallies
`G._poiFound`/`G._poiTotal` for the floor. The very first discovery of each exact PoI (keyed into
`META.codex`) also unlocks a feat.

## 19. Barrier

Barrier is a proactive absorb shield — cast *before* damage lands, distinct from a reactive heal or a
full-invulnerability boon like Aegis, and it decays over time rather than lasting indefinitely.

**Implemented:** turned out TowerLords already had this — `G.ward`'s own existing code comment reads
*"a proactive absorb POOL, cast BEFORE damage lands — mechanically distinct from Aegis's full
invulnerability window,"* decaying at 2% max-HP/second and consumed in `hurtPlayer()` right after gold
plating. Added `grantBarrier()` as the one shared entry point, then wired the actual missing piece: a
**Relic of the Founding** analog — water-field + leap-finisher combos (see §2) now grant Barrier on top
of their heal, via `comboLeapAt()`/`comboOnHit()`.

## 20. Hard control effects & the Defiance Bar

Bosses (and other tough foes) carry a Defiance Bar separate from their health bar. Control effects
(stuns, knockdowns, fears) deal instant damage to it — `100 × effect duration`, minimum 25 — rather than
directly controlling the boss; only once the bar breaks does the boss become briefly vulnerable.

TowerLords bosses had no such bar — only ad hoc hard-CC (`e.frozen` from the Deep Freeze keystone) with
no generic "break bar, then vulnerability window" mechanic.

**Implemented:** every boss now spawns with `defianceMax`/`defiance` (≈22% of its max HP).
`applyDefianceDamage()`, hooked into `hitRadius()`'s existing `knock` parameter (reusing the same
`knock*0.02` scale the engine already converts into knockback velocity), depletes it on any
knockback-dealing hit. Breaking it sets `defianceBroken` for a 4s window during which `hurtEnemy()`
applies a flat +50% damage multiplier, surfaced on the boss bar's status tag
("💥 DEFIANCE BROKEN — VULNERABLE"), then the bar regenerates.

## 21. Forcing opponents to fall (hazard-knockback synergy)

In GW2, control effects can shove an opponent off a ledge for fall damage. TowerLords is a flat-floor
arena crawler with no verticality — but it does have lava hazard pools (`G.hazPools`) that already burn
the *player* on contact.

**Implemented:** adapted rather than ported literally — a hard-enough knockback (`e.kx`/`e.kz` past a
threshold) that lands a non-boss enemy inside a lava pool now burns it for ~12% of its max HP via
`reactHit()`, on a short per-target cooldown. The same "shove something into an environmental hazard"
idea, translated to the hazard this game actually has.

## 22. Smoke & water combo fields

GW2's combo-field table includes Smoke (→ stealth/blindness on the right finisher) and Water (→ healing/
regeneration) alongside Fire — each needs a skill that actually drops that field type to matter in play.

**Implemented:** `castWard` (Aegis Ward) now also drops a `water` combo field; `castShield` (Personal
Shield) drops a `smoke` field. `COMBO_TABLE` gained real entries for both — water finishers heal (and a
leap finisher also grants Barrier, §19), smoke finishers apply a chill-style effect as this game's
stand-in for blind. Both reuse 100% of the existing field/finisher infrastructure from §2.

---

## Summary table

| § | GW2 system | Implemented as |
|---|---|---|
| 1 | Dynamic Level Adjustment | `dlaFloorBand`/`dlaEffectiveLevel`/`dlaRewardMult`, `#dlaTxt` HUD readout |
| 2 | Combo fields/finishers | `comboField`/`comboOnHit`/`comboLeapAt`/`COMBO_TABLE` (fire, water, smoke) |
| 3 | Control effects | Dash as a stun-break skill (`doDash()` clears `G.stunT`) |
| 4 | Damage types | crit-independent lifesteal; `hurtPlayer({unmitigated:true})` |
| 5 | Mastery system | `MASTERIES`/`gainInsight`/`checkMasteries`, `META.insight`/`META.masteries` |
| 6 | Achievements | `META.apts`/`checkAchvRewards`, `META_ACHIEVEMENTS`/`checkMetaAchievements` |
| 7 | Specializations/traits | always-on minor lane bonus in `recompute()` |
| 8 | Elite specializations | `beastDashProc()` — Beast Forms alter what Dash does |
| 9 | Weapon vs. slot skills | `slotSwap()` — cooldown travels with the item, not the slot |
| 10 | Attribute taxonomy | `ROLE_ATTR` — one tree-gated stat per role |
| 11 | Crafting discovery/production | `RECIPES`/`craftDiscoveryMatch`/`queueCraft`/`tickCraftQueue` |
| 12 | Upgrade components | `INFUSIONS`/`extractInfusion` (Ascended-only, paid extraction) |
| 13 | Ascended equipment tier | `ASC_RAR`/`makeAscended`/`doAscend`, gated at `LEVEL_CAP` |
| 14 | Attribute prefix bundles | `PREFIX_BUNDLES`/`AFFIX_BUCKET`/`rollPrefixBundle` |
| 15 | Consumables taxonomy | `makeContainer`/`openContainer`, `makeRation`/`useRation` |
| 16 | Vista | `spawnVista`/`triggerVista`, `G.vistaCam` render-loop orbit |
| 17 | Hero Challenges | `spawnHeroChallenge`/`useHeroChallenge` → Mastery Insight |
| 18 | Point of Interest | `spawnPOI`, passive discovery via `META.codex` |
| 19 | Barrier | `grantBarrier()` (the existing `G.ward` pool) |
| 20 | Defiance bar | `applyDefianceDamage`, boss `defiance`/`defianceBroken` |
| 21 | Hazard-knockback synergy | lava-pool burn on knockback, `reactHit()` |
| 22 | Smoke & water combo fields | `castWard`/`castShield` register fields; `COMBO_TABLE` entries |

*Every row above is real, tested game logic in `towerlords.html`, mirrored into `towerlords-mobile.html`
and rebuilt into `towerlords-offline.html`. Verified with `bash tests/run.sh` plus four rounds of ad hoc
harnesses (DLA/combo/mastery/achievements/cooldowns; crafting/infusions/ascension/prefixes/consumables;
vista/hero-challenge/PoI/barrier/defiance/hazard) exercising each system's actual behavior, not just that
it doesn't throw.*
