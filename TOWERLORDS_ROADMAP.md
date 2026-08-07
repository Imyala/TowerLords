# TOWERLORDS — Design Review & Roadmap

*Goal: turn a deep solo ARPG prototype into a co-op roguelite with mass-market reach.*
*Inspirations: Sacred Gold · Realm of the Mad God · Path of Exile · Torchlight 2 · Tiny Rogues · Wizard of Legend.*

---

## 1. What TOWERLORDS already has (honest snapshot)

This is **already a deep ARPG**, not a skeleton:

- **Combat:** auto-attack + 3 bound active skills (8 to choose from), charged signature ultimate, dash with perfect-dodge i-frames, flow/combo bonus, Rampage/Fervor escalation meter.
- **Elements & reactions:** fire/cold/lightning + ignite/chill/shock + elemental reactions.
- **Character depth:** SVG passive **Ascendancy tree** (3 branches + keystones), 5 attributes, level-up points, respec.
- **Loot:** 6 slots, 4 rarities + Uniques, 15 affixes + special affixes (extra projectile/pierce), sockets + 7 gem types, stat potions, 3 flask types on a charge-refill belt. Vendor gamble + reforge.
- **Run structure:** Town hub → climb floors; NORMAL/SAFE/BOSS every 5; 6 biomes; tower-shift timer; floor modifiers (Sacred-style risk/reward); per-floor bounties; Gold Goblin.
- **Enemies:** chargers, ranged/lobbers, elites, telegraphed bosses with multi-phase patterns.
- **Companion:** hatch from eggs, feed/fuse to evolve, auto-collects loot, runs sell-errands (Torchlight pet).
- **Meta:** Fame currency → Perk tree; Feats/achievements; death log (last 40 runs); Hardcore mode; **stash-banking with death-strikes**; New Game+.
- **Tech:** single-file, Three.js (CDN), localStorage saves, procedural floors, screen shake / hit-stop / floating combat text.

**The hard truth:** the *content systems* are genuinely strong. What's missing is everything around **reach** (mobile/web/instant play), **social** (co-op), and **the forever-loop** (seasons, endgame, leaderboards) — which is exactly where 100M-scale games win.

---

## 2. Best features of each inspiration

### Sacred Gold
- Huge seamless open world; free-roam exploration over linear levels.
- **Mounts** (horses) change pace and traversal.
- Many distinct classes, each with unique "Combat Arts."
- Runes upgrade specific skills (build investment).
- Day/night, ambient world, tons of side content.
- Co-op in the shared world.
> **Steal:** world *texture* and risk/reward modifiers (already nodding to this), mounts/traversal flavor, class identity.

### Realm of the Mad God (RotMG)
- **Massively shared space** — dozens of players in one realm, culminating in a server-wide Oryx boss event.
- Pure **bullet-hell dodging** — skill, not gear, keeps you alive.
- **Permadeath** with a fame score tallied on death (the run *means* something).
- **Instant browser play**, tiny footprint, drop-in/drop-out.
- Class-unlock progression; the Vault; trading.
- Public events pull everyone together.
> **Steal:** big shared sessions, dodge-skill ceiling, permadeath-as-score, instant web play, server events.

### Path of Exile
- The deepest **passive tree** + **skill-gem / support-gem linking** in the genre.
- **Seasonal Leagues** (fresh economy every ~3 months) — the single biggest replayability engine in ARPGs.
- **Endgame Atlas / maps** — an infinite, self-directed endgame.
- Deep, deterministic-ish **crafting**.
- Ethical F2P: only cosmetics + stash tabs sold.
- Build diversity so wide it spawns a content ecosystem.
> **Steal:** support-gem linking, **seasons/leagues**, a real endgame map system, build diversity, cosmetic-only monetization.

### Torchlight 2
- **Pet that sells loot in town** (TOWERLORDS already has this!).
- **Easy drop-in LAN/online co-op (up to 6)** — friction-free.
- Accessible but deep; great game feel; charge/skill system.
- **New Game+**, mod support (Steam Workshop).
- Charm/socket gear customization.
> **Steal:** *frictionless* co-op, accessibility, NG+ depth, moddability/sharing.

### Tiny Rogues
- Tight **run-based** structure: room → room → boss.
- **Build-defining items & insane synergies** — combos that break the game in fun ways.
- Many **weapon archetypes**, each playing differently.
- Difficulty tiers / curses for ramping challenge.
- Fast, meaningful runs; clear "one more run" hook.
> **Steal:** synergy-driven items, weapon archetype variety, escalating difficulty modifiers, snappy run length.

### Wizard of Legend
- **Spell-chaining combat** — equip a loadout of "arcana," chain them fluidly.
- **Dash-cancelling** combos; tight, expressive controls.
- Relic synergies that reshape your kit.
- Boss rush; signature spell.
- **Local co-op.**
> **Steal:** combo-chaining feel, dash-cancel expressiveness, loadout-building, relic synergies, couch co-op.

---

## 3. Gap analysis — Have / Partial / Missing

| Feature | TOWERLORDS today | Source of inspiration |
|---|---|---|
| Passive tree | ✅ (small, ~28 nodes) | PoE |
| Active skill loadout | ✅ (8, bind 3) | WoL, PoE |
| Support-gem / skill-link depth | ❌ | PoE |
| Synergy / build-defining items | 🟡 (6 uniques) | Tiny Rogues, PoE |
| Loot, rarities, affixes, sockets | ✅ | PoE, Torchlight |
| Crafting | 🟡 (reforge + gamble) | PoE |
| Elements + ailments + reactions | ✅ | PoE |
| Pet sell-errands | ✅ | Torchlight |
| Floor / map modifiers | ✅ | Sacred, PoE maps |
| Procedural levels | ✅ | all |
| Bosses w/ telegraphs | ✅ | RotMG, WoL |
| Dodge-skill ceiling | 🟡 (dash + perfect-dodge) | RotMG, WoL |
| Combo-chaining feel | ❌ | WoL |
| Weapon archetypes | ✅ (6: sword/daggers/bow/staff/wand/cannon) | Tiny Rogues, RotMG |
| Distinct classes | 🟡 (attribute-based, no identity) | Sacred, RotMG |
| Endgame map/Atlas loop | 🟡 (thin NG+) | PoE |
| **Seasons / leagues / ladders** | ❌ | PoE, RotMG |
| Permadeath-as-score | 🟡 (hardcore + death log) | RotMG |
| **Co-op (local / online / LAN)** | ❌ | Torchlight, RotMG, WoL |
| **Mobile / touch controls** | ❌ | (reach) |
| **Instant web play** | ✅ (it's HTML!) | RotMG |
| **Accounts / cloud saves** | ❌ (localStorage) | (reach/social) |
| Cosmetics / F2P monetization | ❌ | PoE |
| Live-ops / events | ❌ | RotMG, PoE |
| Moddability / sharing | ❌ | Torchlight |

---

## 4. The roadmap — what makes it addictive & replayable

Ordered by **impact-to-effort for retention**. The systems are strong; these are the multipliers.

### Pillar A — Moment-to-moment feel (the "one more run" hook)
1. **Combo-chaining & dash-cancel** (Wizard of Legend): let skills cancel into each other / into dash, reward stringing them. Turns 8 skills into expressive play.
2. **Weapon archetypes** (Tiny Rogues): make the auto-attack a *choice* — bow/staff/dagger/cannon each with feel + scaling. Instant build identity.
3. **Juice pass:** more hit-stop on big hits, kill-burst escalation, sound layering, crit pops, on-level screen flourish. Cheap, enormous perceived-quality gain.
4. **Controls for everyone:** twin-stick/gamepad + **touch** (virtual stick + auto-aim). Prerequisite for mobile and couch co-op.

### Pillar B — Replayability engine (the forever-loop)
5. **Seasons / Leagues** (PoE) — *the* highest-leverage feature. Periodic ladder resets, a seasonal modifier/theme, fresh leaderboard. Even solo, this is what makes ARPGs eternal.
6. **Leaderboards + permadeath score** (RotMG): every death posts a fame score; weekly/seasonal boards; "furthest floor" races. Stakes + bragging = virality.
7. **Endgame map device** (PoE Atlas): after floor N, a self-directed system of modifiable maps with escalating risk/reward, instead of just linear NG+.
8. **Daily seed run** (roguelite staple): everyone plays the same seed today; compare scores. Built-in daily retention + social compare.
9. **Difficulty tiers / curses** (Tiny Rogues): opt-in modifiers for more reward — gives mastered players a reason to keep climbing.

### Pillar C — Build depth & synergy
10. **Support-gem links** (PoE): socket support gems into actives (e.g. Multistrike, Fork, Ignite-on-hit). Multiplies build space with existing data.
11. **More build-defining uniques** (currently 6 → 30+) with *mechanics*, not just stats. This is where "broken fun combos" live.
12. **Class / Ascendancy identity** (Sacred/PoE): a starting-class choice that flavors the tree and a signature mechanic — gives runs a fantasy, aids new-player onboarding.

### Pillar D — Social & co-op  *(your stated #1 — full plan in §6)*
13. Local couch co-op → LAN → online, 1–8 players. Co-op is the strongest retention & word-of-mouth driver in this genre.
14. ~~**Player-to-player social systems**~~ — built: recruitable Rescued companions, a persistent-per-run
    roaming world event (THE UNCLAIMED), direct player trading (with a gold toll, re-validated at
    execution, works local and online), and a session-scoped Crew with a donation-fed treasury and
    party-wide bonus tiers. See `TOWERLORDS_COOP_SOCIAL_FEATURES.md` for what shipped vs. what was
    deliberately scoped down from the source ideas (no cross-run persistence — that needs Pillar E's
    accounts first).

### Pillar E — Retention / accounts / monetization
14. **Accounts + cloud saves** — required for cross-device, co-op identity, leaderboards.
15. **Cosmetic-only F2P** (PoE-ethical): skins, pet/trail/portal cosmetics, stash tabs. Monetize without pay-to-win — essential for a 100M-friendly reputation.
16. **Battle pass / seasonal rewards** tied to the league cadence.
17. **Live events** (RotMG Oryx): timed world bosses / invasions that pull the community together.

### Pillar F — Reach / distribution
18. **Mobile-first packaging:** it's already HTML — wrap as PWA + Capacitor for app stores; web build for instant play; later Steam.
19. **Performance budget:** instancing, object pooling, LOD — must hold 60fps on mid-range phones with 8 players on screen.
20. **Shareability:** post-run share cards (floor reached, build, score), replay GIFs, invite links.

---

## 5. Reality check on "100M+ players"

Worth being straight with you, because it shapes priorities:

- RotMG peaked in the low millions; PoE has tens of millions of registered accounts over a decade. **100M+ is mobile / hyper-casual / web-viral territory** — Vampire Survivors, Survivor.io, Brawl Stars, .io games.
- Games at that scale share a profile TOWERLORDS can *absolutely* aim for: **instant play, tiny footprint, runs on a phone, free, drop-in co-op, short sessions, endless live-ops.** Your HTML/Three.js base is a real advantage here — no install wall.
- The path to those numbers is **~60% distribution/platform/monetization/virality and ~40% features.** The features in §4 make it *worth* playing and *worth telling friends about*; co-op + mobile + seasons + shareability are what make it *spread*.
- Concretely: depth (PoE/Tiny Rogues) earns the hardcore; **co-op + mobile + instant-play + daily/seasons** earn the masses. We need both, sequenced so each milestone is shippable and fun on its own.

---

## 6. Co-op architecture — 1–8 players, local + online + LAN

Your spec: 1–8 local, 1–8 online, or e.g. 4 local + 4 online, plus LAN; "super easy" for a family on one device *or* many devices on a network *or* over the internet.

### The core prerequisite (do this first, it unlocks everything)
The current code uses a single global `G.player` mutated directly inside the render loop, with `Math.random()` everywhere. Before *any* co-op:

1. **Players become an array.** `G.players[]` instead of one player; all input/camera/loot logic loops over players.
2. **Input abstraction layer.** Every player reads from an `InputSource` — keyboard, each gamepad, touch, *or network*. Same sim code regardless of where input comes from.
3. **Separate simulation from rendering.** Fixed-timestep sim (e.g. 30/60 Hz) that's serializable; rendering interpolates. This is the gate for netcode.
4. **Seeded RNG** for reproducible floors (also enables daily seeds from §B8).

*The content layer — items, skills, tree, enemies, bosses — is reusable as-is. This is a core-loop refactor, not a rewrite.*

### Networking model — recommendation: **host-authoritative snapshot replication**
Not lockstep determinism (fragile with floats + Three.js). Instead the proven .io/RotMG approach:
- One **authority** simulates the world. Clients send **inputs**, receive **state snapshots**, render with interpolation + client-side prediction for their own movement.
- For friends/LAN, the authority is a **host player** (no server cost). For public matchmaking + anti-cheat + scale, the authority is a **dedicated server**.

### Phased delivery (each phase ships something fun)
- **Phase 1 — Local couch co-op (no network).** Shared screen, **dynamic camera that frames all players**; shared or instanced loot; revive-downed-ally. Multiple gamepads + keyboard split. *Delivers the "family on one device" goal and forces the multi-player refactor that everything else needs.*
- **Phase 2 — LAN / friend online (P2P).** Host-authoritative over **WebRTC data channels** (works LAN and over internet, free, no server). One player hosts, up to 7 join via invite/room code. *Delivers online + LAN co-op.*
- **Phase 3 — Mixed (4 local + 4 online).** Because players are an array and input is abstracted, the host runs N local players *and* accepts remote inputs. Mostly "free" once Phases 1–2 exist.
- **Phase 4 — Dedicated servers + matchmaking.** Authoritative server (Node + WebSocket; consider Colyseus/Nakama or custom), public games, anti-cheat, RotMG-style shared hubs and world events. *Needed for true scale and the §B leaderboards/seasons integrity.*

### Co-op design notes
- **Camera:** shared zoom-to-fit for couch; per-client camera for online.
- **Loot:** instanced ("each player sees their own drops") avoids fights — best for families/casual. Offer shared as an option.
- **Scaling:** enemy count/HP scales with player count so 8-player runs stay tense, not trivial.
- **Drop-in/drop-out** (Torchlight/RotMG): joining mid-run is a huge friction-killer for the mass market.
- **Friendly fire off**, easy revives, generous — "super easy for a family" means forgiving co-op defaults.

---

## 7. Recommended sequencing

A build order where every milestone is shippable and compounding:

1. **Game-feel + controls pass** (Pillar A 1–4): combo/dash-cancel, weapon archetypes, juice, **touch/gamepad**. Makes the game feel premium and unlocks mobile + couch co-op inputs.
2. **Core-loop refactor** (§6 prerequisite): players-array, input layer, fixed-timestep sim, seeded RNG. Invisible to players but unlocks co-op, daily seeds, leaderboards.
3. **Local couch co-op** (Phase 1): first co-op milestone, immediately fun, "family on one device."
4. **Replayability engine** (Pillar B 5–8): seasons, leaderboards, endgame maps, daily seed. The retention backbone.
5. **Online/LAN co-op** (Phases 2–3): friends + LAN, then mixed local+online.
6. **Build depth** (Pillar C): support links, more uniques, class identity — for the hardcore tail.
7. **Accounts, cosmetics, mobile packaging, live-ops** (Pillars E/F): the mass-market & business layer.
8. **Dedicated servers + public co-op + world events** (Phase 4): scale.

---

## 8. Open questions for you

- **Platform priority:** web-first, mobile-first, or both together? (Drives the controls/perf work.)
- **First milestone:** start with the **game-feel/controls pass**, or jump straight into the **co-op refactor** (which couch co-op needs)?
- **Art/scope:** keep the current neon-geometric look (fast, cheap, scalable) or invest in more visual identity later?
- **Monetization stance:** committed to cosmetic-only F2P? (Affects trust, and how leaderboards/seasons are designed.)
