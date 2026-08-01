# TowerLords — The Skill Trees

*Rebuilt from scratch around the MMO holy trinity and its sub-roles.*

---

## 1. Shape

Six columns, one per role, plus The Beast (relic-unlocked forms, no points). Each column carries
**four sub-role lanes** that run all the way down it. Nine rows, 24 nodes, **93 ranks** per tree —
and 93 is exactly the lifetime skill budget, so one climb to Level 255 maxes exactly one role.

| Row | Contents |
|---|---|
| 0 | Foundation — the role's core stat (1 node) |
| 1 | **Lane openers** (4) — this is where you choose your sub-role |
| 2 | Lane core (4) |
| 3 | **SKILL** (1) — learn the role's signature active |
| 4 | Lane power (4) |
| 5 | Lane notable (4) — the ◆ rule-breakers live here |
| 6 | **SKILL** (1) — a second active |
| 7 | **Lane KEYSTONE** (4) — one point, build-defining, one per lane |
| 8 | Capstone (1) — the pinnacle of the whole role |

144 nodes total, down from roughly 600. Every node is a chunky multi-rank stat, a skill you learn,
or a one-point keystone that changes how you play.

---

## 2. The six roles and their 24 sub-roles

| Column | Role | Lane 1 | Lane 2 | Lane 3 | Lane 4 |
|---|---|---|---|---|---|
| 🛡️ **Vanguard** | Tank | Main Tank | Off-Tank | Evasion Tank | Brawler Tank |
| ➕ **Mender** | Healer | Barrier | Regeneration | Burst Healer | Utility / Aura |
| ⚔️ **Striker** | Melee DPS | Berserker | Assassin | Martial Artist | Executioner |
| 🏹 **Ranger** | Ranged DPS | Marksman | Gunslinger | Beastmaster | Kiter |
| 🌈 **Elementalist** | Caster DPS | Pyromancer | Cryomancer | Stormcaller | Warlock |
| 🔮 **Warden** | Support / Hybrid | Enchanter | Crowd Control | Spellblade | Summoner |

Every lane ends in its own keystone:

- **Vanguard** — Bulwark of the Titans · Gravitational Pull · Untouchable · Blood Tyrant
- **Mender** — Mana Bulwark · Eternal Bloom · Hand of Salvation · Chronomancer
- **Striker** — Avatar of Rage · Glass Cannon · Thousand Fists · Reaper's Toll
- **Ranger** — Perfect Shot · Gun Kata · Master of Beasts · Never Standing Still
- **Elementalist** — Everburn · Deep Freeze · Conduction · Plague Lord
- **Warden** — Archmage · Absolute Control · Weaver · Legion Master

The Warden capstone is **Jack of All Trades** — partial healing, minor damage, a companion buff and
cooldown reduction all at once, for the flex slot the taxonomy asks for.

**Twelve skills** are taught by the trees, two per role: Taunt, Singularity, Aegis Ward, Purify,
Bladestorm, Reaping Scythe, Ice Lance, Volley, Flame Cone, Thunderstorm, Power Infusion, Time Warp.

---

## 3. Following one lane actually works

The old row gate wanted **half of every row's ranks**. On a four-lane row that meant funding two
lanes before you could descend — the exact opposite of committing to a sub-role. The gate is now:

```js
tierGateNeed = max(1, min(ROW_GATE_CAP /*6*/, ceil(rowRanks * 0.34), smallestNodeInRow))
```

The `smallestNodeInRow` term is the important one: a row can never demand more than its smallest
node can supply, so **any single lane is always a legal route down the column**. This is verified —
the test suite walks all 24 lanes from row 0 to their keystone, spending only on that lane.

A committed specialist reaches their keystone in **27–31 points**, leaving ~60 of the 93 to deepen
the lane, spill into a second one, or diverge into a neighbouring role.

The two single-node **SKILL rows are lane-neutral**. Everyone passes through them, so tagging them
with one lane implied a restriction the engine never enforced — and told a Main Tank that the row
they're forced through belongs to the Off-Tank.

---

## 4. Migration — nobody loses their points

Every talent id changed, so an existing character's allocations point at nodes that no longer exist.
Left alone that would silently eat both the talents and the points spent on them.

`migrateTalents(p)` runs on save load, on network build sync, and once at boot:

- allocations referencing unknown nodes are dropped
- ranks above a node's new max are clamped and the difference refunded
- `skillGranted` is re-clamped to the new (smaller) budget
- the character is handed back **a full tree's worth of points** to respend
- the save is stamped with `treeVer` so it only ever happens once

The player gets a banner and an event-log line explaining what happened.

---

## 5. Two real bugs this surfaced

**Negative armour granted maximum damage reduction.** `dr()` computed `a/(a+55+floor*8)` unclamped.
Once armour fell below `−(55+floor*8)` the ratio flipped above 1 and clamped to the **78% ceiling** —
so every trade that sells armour for damage (Avatar of Rage −40, Blood Tyrant −24, Reckless Fury
−6/rank) was quietly making you near-invulnerable instead of fragile. A Berserker sitting at −71
armour was taking 78% less damage. Armour is now floored at zero before the curve.

**A keystone flag that did nothing.** The Barrier lane originally used `gives:'overheal'`, which
`recompute()` stores into `S.overheal` and *nothing anywhere reads*. The node would have been a
lie. It now uses `mindMatter`, which is implemented (maximum mana becomes skill damage) and is a
better Barrier identity anyway. The suite now checks every flag has a live read, so a decorative
keystone can't ship again.

---

## 6. Tests

`bash tests/run.sh` — 74 checks. The tree-specific ones:

- six roles, nine rows, exactly four lanes each
- 24 lane codes, globally unique, all labelled
- all six trees cost exactly the skill budget (a cheaper tree would strand points)
- every node named, iconed, ranked, and actually doing something
- every effect key exists in `EFF_LBL`; every taught skill exists in `SKILLS`; every proc type is
  one the engine handles
- **every keystone flag has a live implementation**, not just an assignment
- keystone row covers all four lanes; skill rows are lane-neutral
- **all 24 lanes reach their keystone solo**
- migration: refunds stale allocations, no-ops on current saves, clamps over-cap ranks
- negative armour clamps to zero mitigation

---

## 7. Tuning knobs

```js
// tree shape — edit SPECS directly; the suite will tell you if a tree drifts off-budget
const ROW_GATE_CAP = 6;    // hard ceiling on any row's gate
const SPEC_GATE    = 3;    // legacy per-tier gate constant
const DIVERGE_MIN  = 10;   // points in a tree before it can bridge into a neighbour
const DIVERGE_STEP = 5;    // extra points per additional tier of bridge depth
const DIVERGE_MAXTIER = 6; // deepest a bridge reaches (trees are 9 rows)
```

If you rebalance a tree's rank total, every tree must move together — `SKILL_BUDGET` is the max
across all six, and any tree below it leaves its players with unspendable points. The suite fails
loudly if that happens.

---

## 8. UI pass (menus & HUD)

**The permanent red border.** `#vignette.low` is the low-health warning glow, but it was toggled on
`G.hp/G.maxhp < 0.3` with no check that a run was even in progress. On the menu, in the Sanctuary and
after death (`hp` 0) it latched on and never cleared — a red edge around the screen at all times, and
the actual warning became meaningless. It now requires `running && !dead && maxhp > 0`.

**Pinned menu headers.** Panels were themselves the scroll container, so the title and the ✕ scrolled
away with the content. Each panel is now a flex column whose contents are wrapped in a scrolling
`.panelBody` — the header and close button stay put however far you scroll. The wrapper is applied at
boot by `pinPanelHeaders()` rather than in the markup, so no panel can be missed. The skill tree is
skipped: it already has a pinned `#treeHead` and a `flex:1` body that rewrapping would collapse.

**No visible scrollbars.** The wheel still scrolls everything; the bars simply never paint
(`scrollbar-width:none` plus zeroed `::-webkit-scrollbar` across panels, bags, the tree, the log and
the top-right HUD box).

**Text sizes.** Panel titles 14→16px, hints 11.5→12.5px, section headings 11→12.5px, sort chips
9.5→11px, pause-menu items 13→14.5px, compass chips 11→12.5px, top-right HUD 11→13px, floor number
22→26px.

**The quest line.** `#bountyTxt` was an 11px, 65%-opacity line indistinguishable from the ambient
HUD text around it. It is now a bordered gold card with a `◈ QUEST` label, a soft attention pulse,
and the progress count in bold — and it only renders when a quest is actually active.

**Panel sizing.** Defaults were a fixed `860×700` box, which opened the bag as a narrow column with
dead space beneath it. Panels now default to a generous share of the viewport
(`min(1240px,94vw)` for Inventory) with **no forced height**, so they hug their content up to
`max-height:94vh`.

The size is only written to storage when you actually **drag the resize gripper** — the old
`ResizeObserver` fired on the first layout and on every content re-render, which silently froze the
default into storage and stopped panels ever hugging their content again. A saved size then wins
forever after.

### Tests added

- the red edge is clear on the menu, when dead, at 0/0 max health and at 90% health — and present at 10%
- panels apply their default on first open, never write on open, and honour a saved size afterwards
- panel contents are wrapped so `h3` and `.closeX` stay outside the scroll area
- the tree panel is left unwrapped
- scrollbars suppressed while `.panelBody` stays `overflow-y:auto`
- the quest card has a ≥13px font and a pulse; top-right HUD text is ≥12.5px
- hint / heading / chip / title font sizes are all above their minimums

The test sandbox also gained real DOM reparenting and a `className` that writes through to
`classList`, without which those last checks would have been reading nothing.

---

## 9. Stash grid layout fix

The stash's two item grids were sized with `flex:1` inside a flex column that has **no definite
height of its own** — the panel now hugs its content, so nothing up the chain resolves to a fixed
height. A `flex-basis:0` child in an indefinite column is precisely the case browsers resolve
inconsistently, and because grid items default to `align-items:stretch`, whatever height the row
landed on was then forced onto each tile — overriding `.tile`'s `aspect-ratio:1/1` and smearing the
icons into tall vertical strips.

This was introduced by the panel rework (§8): before that, panels opened at a fixed `820×560`, which
gave the chain a definite height by accident.

Fixed at both ends so it cannot recur:

```css
.bagGrid{ grid-auto-rows:min-content;   /* a row is exactly one tile tall */
          align-content:start;          /* pack rows at the top */
          align-items:start; }          /* never stretch a tile to fill its row */
.bagGrid > .tile{ width:100% }          /* aspect-ratio:1/1 then decides the height */

.stashSide .bagGrid{ flex:0 0 auto; height:min(46vh,430px); max-height:none; }
.stashCols{ align-items:flex-start }    /* columns no longer stretch each other */
.stashMid{ align-self:center }          /* transfer buttons centre against the grids */
```

Resulting geometry, independent of window size: both columns render **6 square 64×64px tiles per
row, ~5 rows visible**, identical on each side, scrolling by wheel.

`align-items:start` was applied to the shared `.bagGrid` rule (and `.eqGrid` / `.slotRow`), so the
inventory panel's bag and paper-doll are protected from the same failure mode.

A regression test asserts `.bagGrid` keeps all three no-stretch properties, that the stash grids
keep a definite height rather than `flex:1`, and that tiles keep their square aspect-ratio.

> Verified by CSS reasoning and a layout calculation, not visually — no browser was reachable from
> this environment at the time. Worth a quick look in-game to confirm.
