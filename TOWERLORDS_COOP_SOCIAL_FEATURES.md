# TOWERLORDS — Co-op Social Features (companions, world event, trading, crew)

*Four systems ported over from ideas proven out in a sister project's MMO design doc ("The Moon Above
Our World"), each re-scoped to fit TOWERLORDS' actual shape: a solo-first, run-based roguelite ARPG with
host-authoritative local/online co-op (see `TOWERLORDS_ONLINE_COOP_PLAN.md`), not a persistent shared
world. Follows the same "steal the idea, adapt the mechanism, verify against the real code" discipline as
`TOWERLORDS_GW2_MECHANICS.md`.*

---

## 1. Recruitable Rescued companions

**The idea:** a second, following companion — distinct from the pet — recruited from NPCs you've already
freed, who fights alongside you and can be worn down without being permanently lost.

**The adaptation:** TOWERLORDS already had the Rescued/Kept Ones system (`RESCUED_NPCS`, freed from rare
cocoons, permanent and account-level, living in the sanctuary — see `TOWERLORDS_STORY_BIBLE.md` §7). This
feature turns that existing cast into a second combat companion, reusing the pet's follow/attack/downed
shape rather than inventing a new one.

- Stand near a Rescued NPC in the sanctuary and press **F** (interact) to recruit them as your active
  companion (press again to send them back). One companion at a time, chosen from your own freed roster —
  `recruitCompanion`/`dismissCompanion` in `towerlords.html`.
- The companion follows at an offset opposite the pet's, fires a themed bolt at the nearest foe on a
  cooldown, and has its own HP pool (`companionMaxHp()` — scales with floor). Taking chip damage near an
  aggro'd foe mirrors the pet's existing `nearFoe` mechanic.
- **Non-boss enemies can be pulled off you by the companion**: the main enemy chase loop now compares
  distance to the nearest player *and* to the companion, and will chase whichever is closer — bosses
  always stay locked onto real players so telegraphs/readability never change. See the `!e.boss &&
  G.companion` check right where `nearestPlayerTo` is read in the enemy update loop.
- HP ≤ 0 → the companion "falls back" to the sanctuary rather than dying outright (`companionFellBack`),
  and rejoins at 50% HP after a wall-clock timer (`updateCompanion`) — the same reversible-downed shape the
  pet already had, reflecting that a Rescued NPC is a person, not a disposable creature. Death (yours)
  never takes the companion; only combat attrition does.
- Account-bound like the pet yard: `META.companion` persists your choice across runs, loaded in
  `initPlayerChar`.

**Not built:** two companions at once (the sister project's design had this; TOWERLORDS keeps it to one to
match the pet system's single-active-slot pattern), and per-NPC unique abilities (every companion currently
shares one generic attack, distinguished by name/color/flavor only — matches how pet abilities are generic
too).

---

## 2. Persistent world event — THE UNCLAIMED

**The idea:** a rare, roaming, tougher-than-normal enemy that appears occasionally and is announced to the
whole party regardless of where anyone currently is, giving solo and co-op players a reason to converge.

**The adaptation:** TOWERLORDS floors are single shared instances a party climbs through together (not
separate zones the way the source design's MMO supports), so "roams the world" becomes "the enemy is
guaranteed a genuine mid-tier HP pool wherever it lands on this floor," and "announced regardless of
location" is handled two ways: a banner/log line for anyone on the host's own screen (solo, local co-op),
and a small reliable-channel broadcast (`netBroadcastWorldEvent`) to every connected online peer so it
shows up on their screen too, even though online co-op already puts everyone on the same floor.

- `maybeSpawnWorldEvent(rooms)`, called from `generateFloor` alongside the existing Kept-One-cocoon and
  lore-fragment rolls: on a NORMAL floor, gated by a floor-spacing cooldown (`G._weLastFloor`) and a 10%
  roll, spawns an elite (`spawnEnemy(...,forceElite=true)`) and firms its stats up using the same
  gear-anchored trick trash mobs already use (`playerBigHit()`), landing it just under a real floor
  guardian's toughness rather than a fixed number — balanced at every power level for free.
- Distinct visual identity (ice-blue tint + a wide ring), a name (`THE UNCLAIMED`), and a richer loot roll
  on death (`killEnemy`'s `uChanceBase` floor for `e.isWorldEvent`).
- Times out and "fades, unclaimed" after `WORLD_EVENT_LIFE` (150s) if nobody finishes it
  (`tickWorldEvent`, ticked once per frame regardless of local co-op player count); leaving the floor
  (portal/ascend) also forfeits it via the existing `clearWorld()` teardown.
- One at a time per run; killing it clears the tracker so the next one can appear on a later floor.

**Not built:** a true persistent open-world presence (not applicable — TOWERLORDS has no persistent shared
world between runs) and per-region flavor (the source design rotates the event across six named zones;
here there's one floor at a time to place it on).

---

## 3. Player trading, with a toll

**The idea:** two co-op players standing near each other can offer items from their own bag; the trade
only executes once both sides confirm; changing an offer un-confirms both; it's re-validated against
current inventories at execution so an item crafted/sold/equipped away after being offered can't be
traded; a disconnect mid-negotiation cancels it cleanly. TOWERLORDS' specific addition on top of the
source design: **the trade has a cost** — a flat gold toll paid by both sides, taken only if the trade
actually completes.

- Stand within `TRADE_RANGE` (6 units) of a teammate and press **F** (falls through the existing
  `interact()` priority chain, after portal/vendor/stash/etc.) to open or join a trade — `nearestTeammate`,
  `proposeOrJoinTrade`.
- The **Trade** panel (`U`... no — opened automatically, see `tradePanel` in the HTML) shows your own bag
  as a clickable list (click to add/remove from your offer), both sides' current offers, and a Confirm/
  Cancel pair. Reuses the stash panel's existing two-column CSS rather than inventing new layout.
- The toll (`tradeFee()` — 20g + 4g/floor) is charged to **both** participants only at execution
  (`executeTrade`), and the trade is refused up front if either side can't cover it.
- Works for local split-screen co-op (direct in-memory transfer between `_G.players[]` entries) and for
  online peers: trade actions are peer→host commands over the existing reliable channel
  (`netPeerCmd`/`netHostRunCmd`, the same pattern pet actions already use), the host is authoritative for
  the actual `_G.trade` session, and trade-state changes are pushed to both participants' screens
  (`syncTradeToPeers`). A peer's own bag renders fully live (it's already streamed to them); the other
  side's offer renders from a lightweight synced summary (item names/rarity colors) rather than full
  interactive item objects — real and useful, just not pixel-parity with the host's own richer view.

**Verified** (see the session's ad hoc harness runs against `tests/sandbox.js`): a full two-player offer →
confirm → confirm cycle swaps the exact items and charges the exact toll to both sides; an under-funded
side blocks the trade entirely with nothing lost; an item pulled out from under an existing offer (sold,
crafted away) correctly doesn't transfer even though it was still "offered" at confirm time.

---

## 4. Co-op Crew (a session-scoped guild-lite)

**The idea, from the source design:** a persistent, cross-run guild — accounts, ranks, invites, a shared
treasury, guild-wide perks — living independently of any single play session.

**The adaptation — this is the biggest scope cut of the four, and worth being explicit about:**
TOWERLORDS has no account backend and no server between runs (see `TOWERLORDS_ONLINE_COOP_PLAN.md` — it's
deliberately serverless, host-authoritative P2P). There is nothing for a "guild" to persist *in* once the
run ends. So "guild" becomes **Crew**: founded by any climber in the current party for a flat gold toll,
membership is simply "whoever is in this party right now" (no invite/kick mechanics — a co-op party is
already a small, trusted group by the time anyone's sharing a run), and everything about it — name,
treasury, tier unlocks — lives only as long as the run does. This is real, working scope, not a stub: it's
the same "core: creation, membership, treasury, donation-tracked perks" slice the source design's own
guild system shipped first, just anchored to a run instead of an account.

- **Found** (`foundCrew`, 200g) from the new **Crew** panel (`U`), or **donate** (`donateCrew`, fixed
  50/200/1000g buttons) to grow the shared treasury. Every donation is tracked per player
  (`crew.members[id].contrib`) for the roster display.
- **Treasury tiers** (`CREW_TIERS`) unlock small party-wide bonuses the moment the treasury crosses a
  threshold — +5% gold at 500g, +8% XP at 2,000g, +10% more gold (stacking) at 5,000g — wired directly into
  `goldMult()` and `gainXP()` via `crewBonusPct(key)`, so every climber in the party benefits, not just
  whoever founded or donated.
- **Leadership succession**: if the founder disconnects, the longest-tenured remaining member inherits the
  crew automatically (`netReleasePlayer`) — a crew can never end up leaderless, same rule the source
  design's persistent guild uses for its own leader-leaves case.
- Online-synced the same way as trading: `syncCrewToPeers` pushes the whole (small) crew object to every
  connected peer whenever it changes; the panel renders from the live object on the host and from a
  mirrored copy (`_G.crewMirror`) on a peer.

**Verified**: founding costs gold and creates a one-member crew; a donation raises the treasury and
crosses tier thresholds correctly; `crewBonusPct('gold')` measurably changes `goldMult()`'s output; a
leader disconnect hands the crew to the next-longest-tenured member; disbanding clears it and its
treasury for good.

**Not built** (the actual bulk of the source design): cross-*run* persistence of any kind (no accounts to
persist to), invites/kicks/ranks beyond leader-vs-member, guild halls, guild missions or PvP, alignment/
faction systems, and Influence as a separate currency. All of that assumes a persistent backend TOWERLORDS
deliberately doesn't have yet (see Pillar E, `TOWERLORDS_ROADMAP.md` — "Accounts + cloud saves" is still
unbuilt). If accounts ever land, Crew is the natural seam to extend into something that outlives a run.

---

## Where this lives in the code

All four systems are implemented in `towerlords.html` and mirrored into `towerlords-mobile.html` (plus a
touch-parity update to `updateTouchInteract()` so the on-screen Use button shows "Recruit"/"Trade" at the
right moments) and `towerlords-offline.html`. No new files, no new build step — same single-file structure
every other system in this codebase already uses. All three builds pass the existing `bash tests/run.sh`
suite unchanged, and each new system was additionally exercised directly against the real functions via
`tests/sandbox.js`'s harness (propose/offer/confirm/execute for trading; found/donate/tier-unlock/
succession for the crew; spawn/anchor-HP/timeout/kill for the world event; recruit/follow/aggro-pull/
fall-back/revive for companions) rather than only checked for syntax.
