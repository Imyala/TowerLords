# TOWERLORDS — Design-Comparison Review

*What to steal from the inspiration games, tailored to a 1–8 player co-op realm-shooter roguelite. Companion to [TOWERLORDS_ROADMAP.md](TOWERLORDS_ROADMAP.md).*

**Framing:** the north star is *RotMG-the-realm-shooter wearing a roguelite's clothes.* That fuses two opposing pressures — RotMG's **persistent shared world + permadeath economy** vs. the roguelite's **per-run randomized build.** Every mechanic below is judged on whether it serves that fusion at 1–8 players. Co-op **multiplies** the value of mechanics that create *shared spectacle* and **divides** the value of mechanics that demand *solo menu fiddling.*

---

## 1. Sacred Gold — open-world ARPG

**Signature mechanics:** seamless huge open world with a mount, no zoning; class-locked itemization + rune skill upgrades.

**Maps to a co-op realm shooter:** the *seamless continuous world* is the single most transferable idea — it *is* RotMG's "realm." Lean into a persistent hub that spawns roguelite dungeon portals rather than gated levels. Mounts/speed matter a lot in co-op — an 8-player group covering a big map at walk speed is tedious; a RotMG-style speed stat or temporary mount keeps the party clustered.

**Pitfalls:** Sacred's world is mostly *empty between content* — open world without dense encounters is dead air, poison in co-op (players wander off and solo). Don't borrow the scale without the density. Class-locked loot fragments an 8-player loot pool (drops nobody can use) — keep loot broadly usable.

---

## 2. Tiny Rogues — bullet-hell roguelite  ⭐ most important reference

Almost literally "what if a roguelite were a bullet-hell with deep item synergies" — 80% of the pitch minus the MMO layer.

**Signature mechanics:**
- **Weapon archetypes as distinct firing patterns** — each weapon *type* has a fundamentally different attack feel/projectile pattern, not just stats.
- **Item synergy via tags/keywords** — items reference shared keywords (crit, bleed, fire, projectile-count) so builds emerge from stacking interacting modifiers.
- **Curated room cadence** — combat / elite / shop / treasure / boss, a readable rhythm.
- **Tight bullet-hell boss design** — telegraphed multi-phase, dodge-expressive.

**Maps to a co-op realm shooter:** adopt **weapon-archetype-as-firing-pattern** wholesale — instant build identity, natural co-op role differentiation (staff zones, dagger dives). The **keyword/tag synergy system** is the cleanest way to get RotMG-style emergent builds *without a passive tree* — tag everything and let items reference tags. Room cadence → your *dungeon portals.*

**Pitfalls:** balanced for *one* player's dodge skill — patterns fair solo become trivial or unreadable with 8 (more DPS shreds bosses; more bodies hide telegraphs). Scale boss HP/density to headcount and design patterns legible in a crowd. Synergy depth can produce degenerate one-shot builds — fine solo, trivializes shared bosses; cap the nastiest stacks.

---

## 3. Realm of the Mad God — MMO bullet-hell  ⭐ spiritual parent

**Signature mechanics:**
- **Permadeath + soulbound loot + fame economy** — death is final; fame is the scored meta-currency and bragging right, **with no perks bought** — pure prestige / star rating. *(This is exactly the chosen "fame = star rating, no perks" design — the right call: keeps PvE skill-expressive, not pay-to-win-via-grind.)*
- **Shared-world bosses with damage-gated soulbound loot** — a god spawns, everyone swarms it, loot is soulbound and gated by *your own* damage contribution. The genius co-op mechanic: makes a crowd cooperative, not competitive over loot.
- **8/8 stat-maxing via consumable potions** — each stat maxes at 8 pots; potions drop as loot, are a tradeable currency, give persistent character goals.
- **Pet system** — feed unwanted loot to a pet; it levels heal/MP/attack abilities. Makes *every* drop valuable.
- **Tiered loot (T0–T14 + UTs)** — clean numbered tiers + special untiered uniques.

**Maps to a co-op realm shooter** (most of this *is* the spec — the question is faithful implementation):
- **Damage-gated soulbound loot is THE keystone co-op mechanic. Build it first.** It's the only clean solution to 8-player loot fairness: everyone who meaningfully contributes gets their own roll. No theft, no DPS-race resentment.
- **Fame = star rating, no perks** — keep it cosmetic/prestige; the "no perks" discipline is what keeps an 8-player realm fair and skill-based. Don't blink.
- **Pet feeding** is the perfect loot sink for a roguelite drowning in drops — converts loot-vacuum tedium into investment; a healing pet adds a soft support role.
- **8/8 potion maxing** gives persistent goals *outside* any single run — important because pure roguelites have no persistence and the realm wants returning characters.

**Pitfalls:** permadeath + persistent maxing is *brutal* and niche; losing an 8/8 character to lag is rage-inducing. Consider a softer death (character is roguelite-permadeath within a run, account keeps fame/cosmetics). **This is the highest-stakes design fork in the project.** The potion economy invites botting/RMT if trading exists. Damage-gating must be tuned so support/apprentice builds still clear the threshold, or you punish the exact co-op behavior you want.

---

## 4. Path of Exile — ARPG depth engine  ⚠ most dangerous to copy

The richest systems here, and the most dangerous — PoE is a *solo theorycrafting* game; almost none of its depth was designed for 8 people sharing a screen.

**Signature mechanics:** massive passive tree; **skill-gems-in-sockets + support gems**; loot filters; deterministic-ish crafting + rotating seasonal leagues.

**Maps to a co-op realm shooter:**
- **Support-gem socketing is the one to steal.** "Your fireball + a fork support + a burn support" maps *perfectly* onto a twin-stick shooter: the base shot is the gem, supports modify the projectile. Visible, action-first build modularity — more co-op-friendly than a passive tree because it shows in how each player's shots behave.
- **Loot filters** become near-mandatory once you combine RotMG loot volume with 8 players' drops. Even a simple "hide trash" rarity toggle is a needed QoL win.
- **League mechanics → realm events** (rotating modifiers / boss invasions). Good for long-term retention later.

**Pitfalls:** **Do NOT clone the passive tree** — a solo min-maxer's puzzle that produces 30-minute menu sessions, death to co-op pacing, and antithetical to RotMG's "just play" ethos (and the "no perks" pillar already rejects it). PoE's crafting/economy is a multi-year treadmill — out of scope. PoE loot is *unbalanced by design* — in a shared realm that creates haves/have-nots; keep the power band tighter.

---

## 5. Torchlight 2 — game-feel reference

Borrow the *texture and generosity,* not the structure.

**Signature mechanics:** **pet that fights AND runs to town to sell loot**; gem socketing with a socket-removal NPC (low-stakes customization); **charge bars** (build during combat, reward aggression); generous juicy feel (fast loot, big numbers, satisfying feedback).

**Maps to a co-op realm shooter:** the **pet-runs-to-town-to-sell** idea fuses beautifully with RotMG's feed-pet loot sink — your pet is *both* a support companion *and* loot-disposal automation (better than either game's pet alone). **Charge bars** translate directly: an ability resource that builds via aggression rewards staying in the fray — co-op spectacle wants this. **Removable gems** lower build-commitment anxiety — important in a permadeath game where players already fear loss. Torchlight's **game-feel generosity** is the cheapest high-impact polish you can copy — RotMG is famously *austere*; differentiate by being juicier.

**Pitfalls:** cozy side-loops (fishing) are awkward in fast co-op — make them async/optional. Number inflation breaks the soulbound-damage-gating math — keep scaling legible.

---

## 6. Wizard of Legend — combat-feel reference

The best *moment-to-moment combat* on this list. Steal *kinetics,* not systems.

**Signature mechanics:** **spell-chaining combos** (equip a loadout of arcana, chain them fluidly); **dash as offensive/defensive core verb** (i-frames + reposition + attack delivery); arcana relics (build-defining pickups).

**Maps to a co-op realm shooter:** the **dash-as-core-verb** is the single best idea here for a bullet-hell. RotMG has *no dodge* (you weave by raw movement) — divisive. A skill-expressive dash with i-frames raises the skill ceiling and gives an "out" when 8 players make screens chaotic. **This is the biggest opportunity to improve on RotMG.** **Spell-chaining** → a secondary-ability loadout (2–3 chainable abilities alongside basic fire); combined with PoE support-socketing, that's a rich action-first build system with zero menu trees.

**Pitfalls:** ultra-precise combos get lost in 8-player chaos — keep core combat *readable* (a few high-impact abilities over dozens of fiddly chains). Dash i-frames + bullet-hell trivialize patterns if dash is spammable — gate it (cooldown/stamina) so dodging stays a *decision.*

---

## 7. Bullet Heaven 2 — survivors-like pacing reference

The outlier — useful as a *pacing/onboarding* model, not a core loop.

**Signature mechanics:** auto-firing + survivors-like upgrade draft; wave/escalation structure (the map fills with bullets as you grow); tight upgrade pacing (a level-up every few seconds early).

**Maps to a co-op realm shooter:** the **level-up draft** is a fantastic *in-run* power system for dungeon portals — enter a portal, draft temporary upgrades (Tiny-Rogues-meets-Survivors), giving the roguelite "this run's build" feeling atop the persistent RotMG character. **Escalation/horde waves** make a great *co-op realm event* (8 players defend escalating density — low design cost). The **fast early cadence** is a great onboarding teacher before players grasp deeper synergies.

**Pitfalls:** auto-fire removes aiming — kills twin-stick skill expression. Borrow the *draft and pacing,* not the auto-fire. Survivors-like curves end in screen-nuking trivialization — keep it a *mode/event,* not the spine.

---

## Synthesized: Top 10 Mechanics to Steal (ranked by impact-to-effort)

For a 1–8 player co-op realm shooter. "Effort" assumes twin-stick movement + networked combat already exist.

| # | Mechanic | Source | Why it wins for 1–8 co-op | Impact / Effort |
|---|----------|--------|---------------------------|-----------------|
| **1** | **Damage-gated soulbound loot** | RotMG | The only clean fix for 8-player loot fairness — everyone who contributes gets their own roll. Eliminates theft & DPS-race resentment. **Build first.** | Huge / Low-Med |
| **2** | **Weapon archetypes = distinct firing patterns** | Tiny Rogues | Instant build identity, natural co-op role differentiation, reads perfectly top-down. Core to the pitch. | Huge / Med |
| **3** | **Dash-as-core-verb (i-frames, gated)** | Wizard of Legend | Fixes RotMG's biggest weakness (no dodge); raises skill ceiling; an "out" for crowded screens. Top differentiator. | Huge / Med |
| **4** | **Keyword/tag item-synergy system** | Tiny Rogues | Emergent builds with no passive tree — combinatorial depth from a small tagged set. Pairs with #2. | High / Med |
| **5** | **Fame = star rating, no perks** | RotMG | Keeps an 8-player PvE realm fair and skill-based; pure prestige avoids grind-to-win. *(Already chosen — protected.)* | High / Low |
| **6** | **Pet feeding + auto-sell loot sink** | RotMG + Torchlight 2 | Turns loot-flood into investment; soft support role; automates inventory tedium. The two pets are better fused. | High / Med |
| **7** | **In-run level-up draft** | Bullet Heaven 2 / Tiny Rogues | Each portal-run gets the roguelite "this run's build" rush atop the persistent character. | High / Med |
| **8** | **Support-gem socketing for abilities** | Path of Exile | Visible, action-first build modularity (fork/burn/chain your shots) without a menu tree. Co-op-readable. | High / Med-High |
| **9** | **Charge bars + juicy game feel** | Torchlight 2 | Cheap polish with outsized payoff; rewards staying in the fray. Differentiates from RotMG's austerity. | Med-High / Low |
| **10** | **Seamless persistent realm + rotating events** | Sacred + PoE leagues | The "realm" that makes you RotMG-not-just-a-roguelite; events give long-term retention. Bigger lift — schedule later. | High / High |

### The opinionated through-line

The spine is **#1 + #2 + #3**: soulbound damage-gating makes co-op *fair,* weapon archetypes make builds *distinct,* a gated dash makes combat *yours* (and fixes RotMG's most-complained-about flaw). Layer #4/#7/#8 for build depth, #5/#6 for the persistence-and-prestige loop, #9 for feel. Treat **#10 and the permadeath/economy decisions as the strategic forks** — they define whether you're building a tight 8-player roguelite or a true persistent MMO-lite, the most important call in the project.

### Two hard warnings (repeated because they matter most)

1. **Do NOT import PoE's passive tree or crafting economy** — solo-theorycraft systems that murder co-op pacing and contradict the "no perks" pillar.
2. **Solo-tuned bullet patterns break at 8 players** — design boss patterns *legible in a crowd* (large, arena-spanning, slow) and scale HP/density to headcount from day one, or shared bosses become unreadable chaos or instant DPS-melt. *(See [TOWERLORDS_BULLET_PATTERNS.md](TOWERLORDS_BULLET_PATTERNS.md) §"Cross-cutting fairness".)*
