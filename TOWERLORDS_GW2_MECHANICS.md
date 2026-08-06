# TowerLords — GW2 Mechanics Worth Stealing

*Reference notes on Guild Wars 2 systems, mapped to what TowerLords already has and what's still open.*

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

## 8. Elite specializations (mechanic-altering, weapon-unlocking)

Elite specs don't just add traits — they swap out or expand the profession mechanic entirely and unlock
a new weapon type, gated behind fully training the core tree first and costing far more points (250 vs
60). Only one can be equipped, always in a reserved slot.

This maps well onto TowerLords' companion evolution / relic-unlocked "Beast" forms already noted in the
skill-tree doc. **Steal:** treat a subset of high-tier unlocks (Beast forms, or a future weapon-swap
system) as reserved-slot, mechanic-altering picks rather than just bigger numbers — they should change
*how* a build plays, not just its stats.

## 9. Weapon skills vs. slot skills, unlocked by level

GW2 splits the bar into weapon skills (fixed per weapon, always available once the weapon is equipped)
and slot skills (heal/utility/elite, purchased individually with hero points, unlocked in sequence at
specific levels: 11, 15, 19, 31). Weapon-skill cooldowns tick even while the weapon is stowed/swapped.

TowerLords already has 3 bound actives + ultimate. The specific idea worth lifting: **background cooldown
ticking** — if a future weapon-swap or stance system is added, swapped-out skills should keep cooling
down rather than freezing, so swapping isn't a pure cooldown-reset exploit.

**Steal:** cooldowns tick regardless of whether the skill is currently "equipped"/active, once any
skill-swapping mechanic exists.

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

---

## Summary table

| GW2 system | TowerLords equivalent today | Gap to fill |
|---|---|---|
| Dynamic Level Adjustment | none | scale-down view for overleveled chars on early floors |
| Combo fields/finishers | elemental reactions (ignite/chill/shock) | field+finisher tagging & lookup table |
| Boons/conditions/control | conditions + flasks | dedicated control-effect (stun-break-only) bucket |
| Damage types | elemental/physical split | lifesteal as its own math path; unmitigated hazard flag |
| Mastery system | Evolution System + Ascendant Seals | account-wide, non-resetting, biome-scoped unlock currency |
| Achievements | Feats/achievements | point ladder + meta-achievement umbrellas |
| Specializations/traits | skill tree lanes (adept→grandmaster shape) | always-on minor bonus per lane |
| Elite specializations | Beast forms (relic-unlocked) | reserved-slot, mechanic-altering framing |
| Weapon vs. slot skills | 3 actives + ultimate | background cooldown ticking for future skill-swap |
| Attribute taxonomy | 5 core attributes | primary/secondary/derived split + role-specific attribute |
| Crafting discovery/production | none (loot/vendor/reforge only) | tiered materials + discovery pane + speed-up production queue off the existing craft station |
| Upgrade components (infusions/enrichments/glyphs) | 7 gem types, socketable | destructive-vs-freely-swappable split; dedicated extraction tool |
| Ascended equipment tier | Uniques (top of `RARITY`) | a level-255-gated, account-bound tier above Unique |
| Attribute prefix bundles | independent affix rolls (`AFFIXES`) | optional named prefix bundles on Unique-tier drops |
| Consumables taxonomy | Flasks + stat potions | confirm food/utility don't share a buff slot; add a Container item type |

*Note: §11-15 lean on wiki text about crafting, upgrade components, ascended equipment, GW2's attribute-prefix
percentage table, and the consumables taxonomy — same "worth stealing" framing as §1-10, not yet implemented
in code.*
