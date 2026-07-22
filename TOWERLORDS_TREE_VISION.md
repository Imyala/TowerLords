# TOWERLORDS — Tree & Build Vision (the "discovered, not selected" doctrine)

*The master plan for making builds strange, powerful, and recognisable. Companion to TOWERLORDS_STORY_BIBLE.md and TOWERLORDS_ROADMAP.md. North star: **a living tree + boss-organ mutations + ability evolution + rule-breaking keystones.***

Status legend: ✅ shipped · 🔨 partial · ⬜ backlog

| # | System | Status | Notes |
|---|---|---|---|
| 1 | **Living Skill Tree** — the tree reacts to how you fight | 🔨 | Run mutations shipped: Charred Affinity (60 fire hits), Desperation (3 low-HP survives), Perfection (untouched guardian kill). Backlog: withering/deadwood, Adaptation-to-death-types, hidden node reveals in the tree UI. |
| 2 | **Ability Evolution Paths** — one skill, many forms | 🔨 | Blink: Void / Echo / Sacrificial shipped as keystones. Backlog: evolutions for Meteor, Whirlwind, Chain Bolt; Predator/Fractured Blink (need targeting UI). |
| 3 | **Rule-Breaking Keystones** | 🔨 | Shipped: Glass Soul, Stillness, One Against Many, Hollow Victory, Blood Magic, Brutalist, Bloodrage, Overclock + 4 conversion keystones. Backlog: Borrowed Time (deferred death), The Last Spell (single-ability build), Inverted Fate. |
| 4 | **Memory Abilities** | 🔨 | Vendetta shipped (+25% vs lords who've killed you — rides the grudge system). Backlog: Recorded Strike, Repetition, Déjà Vu, Ancestral Pattern (previous-run spectral companion). |
| 5 | **Combo Traits Between Abilities** | 🔨 | Steam Rupture + Grand Conduction shipped (amplify the elemental reaction engine). Backlog: Conductive Blood, Shattered Shadow, Gravitational Execution, Corpse Orchard. |
| 6 | **Trait Chains That Tell a Story** (Beast Branch) | ⬜ | 6-step identity arcs ending in transformation. Natural fit: one narrative chain per spec column, gated like keystones. |
| 7 | **Body-Part Skill Trees** (Eyes/Heart/Hands/Spine/Shadow, evolve max 2) | ⬜ | Could layer onto the trophy system — organs ARE body parts. |
| 8 | **Floor-Dependent Abilities** (Tower Hunger, Tenfold Judgment, Floorbreaker, Tower Debt) | ⬜ | Tower Hunger & Tower Debt are cheap wins (run counters + level-up hook). |
| 9 | **Enemy-Powered Traits / Boss Organs** | ✅ | LORD ORGANS shipped: all 10 lords drop attunable organs (max 2, third expels oldest) — Gatestone Core, Powder Gland, Broodheart, Clockwork Heart, Twin Venom Sac, Gilded Eye, Abyssal Stomach, Mirror Gland, Ledger Page, Crown Shard. Backlog: Devour Essence (elite trait steal). |
| 10 | **Strange Defensive Abilities** (Refuse, Damage Migration, Perfect Scar, Sanctuary of Violence) | ⬜ | Perfect Scar and Armour of Distance are the most implementable next. |
| 11 | **Unusual Summons** (Future Self, Coward's Double, Enemy Council) | ⬜ | Needs a summon framework; pets are the seed. |
| 12 | **Dynamic Risk Traits** (Momentum Pact, Unspent Power, Marked for Greatness, Sealed Flask) | ⬜ | Unspent Power is nearly free (skill-point counter → temp boon). |
| 13 | **Personality Branches** (Mercy/Dominion/Defiance/Curiosity) | ⬜ | Ties beautifully to the grudge + rescue + shrine systems. |
| 14 | **Negative-Trait Nodes** (Unstable Casting, Hungry Weapon, Loud Magic) | ⬜ | The proc system supports downside procs already. |
| 15 | **Ultimate Build Transformations** (Bossborn, The Many, Living Dungeon, The Unwritten) | ⬜ | Endgame of this doctrine. Bossborn (phase-based ability bar) is the flagship. |

> **WAVE 8 — VISION COMPLETE:** the three epics shipped. **The Unwritten** (el): class erased — every row of every tree opens, every node costs 2 points. **The Many** (rg): two echo-selves fight beside you always, each body −20% damage. **Living Dungeon** (tk): every 50 slain forms a ROOM inside you granting a permanent run trait (teeth, moss, eyes, echoes, marrow, sinew). All 15 vision categories now have live implementations; 56 build-defining flags total. Deferred by design: real multi-body control (The Many v2), explorable interior rooms (Living Dungeon v2), Adaptation-to-death-types, Enemy Council.

> **WAVE 7 (FINAL SYSTEMS) UPDATE:** §7 Body Mutations SHIPPED (Eyes/Heart/Hands/Spine/Shadow, 3 tiers each in the Character panel, only 2 may fully evolve) · §13 Personality SHIPPED (Curious Mind / Dominion / Defiance track how you play and grant perks) · §4 COMPLETE-ish (Recorded Strike skill + Repetition keystone join Vendetta, Déjà Vu, Ancestral Pattern) · §2 COMPLETE (all 5 Blink forms — Fractured Blink auto-picks the safest of three futures) · §3 The Last Spell SHIPPED · §15 Master of the Empty Hand + Bossborn phases SHIPPED · §1 tree visuals SHIPPED (Elementalist column CHARS after the fire mutation; neglected trees WITHER). Remaining true epics: The Many, Living Dungeon, The Unwritten (need multi-body control / interior worlds / free-form allocation — dedicated builds).

> **WAVE 6 UPDATE:** thirteen more mechanics live — Refuse, Damage Migration, Unbroken Step (§10) · Gravitational Execution, Corpse Orchard, Walking Catastrophe (§5/§15) · Unstable Casting, Loud Magic (§14) · Momentum Pact, Marked for Greatness (§12) · Tower Debt (§8) · Future Self, Debt Collector (§11). Tree now carries **48 build-defining flags across 1,073 nodes**. Remaining majors: body-part trees (§7), personality branches (§13), Recorded Strike/Repetition (§4), Bossborn/The Many/Living Dungeon/The Unwritten (§15), tree-visual charring & deadwood (§1).

> **ENGINE UPDATE:** five new foundations shipped — `spawnMinion`/`updateMinions` (summons §11), `G.formT` transformations (Apex Form, §6/§15 base), the Borrowed Time damage ledger (§3), `recordHistory`/`castDeja` position rewind (§4), and auto-targeting via Predator Blink's mark (§2/§10 base). Consumers live: **The Beast Branch** (7th tree column, 6-step story chain ending in No Longer Human), **Borrowed Time**, **Déjà Vu** skill, **Predator Blink**, **Grave of Possibilities**, **Ancestral Pattern**. Status: §6 ✅ · §4 🔨 (3 of 5) · §2 🔨 (4 of 5 blink forms) · §11 🔨 foundation.

## Engine primitives now available (build on these)
- `ruleMult()` — conditional damage layer (stillness, crowd-scaling; add any stateful multiplier here)
- `gives:` flags → `S.*` — 21+ build-defining switches read anywhere in combat
- `G.run.boons` pipeline — anything can grant run-scoped stats/procs (mutations, trophies, waystations use it)
- `grantMutation(id,nm,ic,eff,ds)` — behavior-triggered auto-boons with banner + sting
- `TROPHIES` / `attuneTrophy` — limited-slot equip layer outside gear
- Blink-style evolution branching inside any `castX` function
- Reaction hooks in `checkReactions` for cross-element combos
- Tone-based SFX: `sfx.rescue/memoir/mutate/trophy` — add stings per system
