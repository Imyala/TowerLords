# TowerLords — The Evolution System & Ascendant Seals

*Design + implementation notes for the rework that moved the star rating off fame and onto evolutions.*

---

## 1. What changed, in one paragraph

Your star rating used to be a fame meter. Fame accrues automatically from almost everything you do, so
the badge was really a "time played" counter — it went up whether or not you were any good. It now
measures **evolutions**: the number of times you have taken a character to the level cap and been
reborn at Level 1 with every stat, talent and item intact. **One evolution = one star.** Fame did not
disappear — it became the *currency you spend* to buy each evolution, and the price climbs steeply
with rank. And because "reach max level" on its own is just a grind check, evolving is now gated
behind a genuinely difficult new mechanic: the **Ascendant Seals**.

---

## 2. The star ladder

| | |
|---|---|
| Stars per colour tier | 7 |
| Colour tiers | Gray → Light Blue → Dark Blue → Orange → Red → Yellow → White |
| Total stars | 7 × 7 = **49** |
| `MAX_EVOLVE` | **49** (was 20) |

`evolveRank(n)` maps an evolution count straight onto the ladder:

```js
tier  = Math.floor(n / 7)      // clamped to the last tier
stars = n - tier * 7
```

So your 8th evolution is Light Blue 1★, your 49th is White 7★. The badge is account-wide and
"sticky" — `metaEvolves()` returns `max(META.evolves, G.evolves)`, so the rank you have earned never
goes backwards when you start a new character.

The old `fameRank(fame)` function was **kept by name** and now simply ignores its argument and
returns `evolveRank(metaEvolves())`. That was deliberate: roughly a dozen call sites across the HUD,
the co-op lobby, the score panel, the leaderboard canvas and the party list all ask for a rank, and
keeping the signature meant none of them had to change or risk breaking.

---

## 3. The gate: Ascendant Seals

To evolve you must hold **all three seals at the same time**, and every one of them must be earned
**within a single life**. This is the "not easy to achieve" mechanic.

### 🩸 Seal of Blood — *slay guardians*

Kill `3 + evolutionCount` floor guardians this life (capped at 25).

- 1st evolution: 3 guardians
- 10th evolution: 13 guardians
- 25th and beyond: 25 guardians

Roaming Nemesis lords and assist-spawned bosses **don't count** — it has to be a real floor guardian,
the same rule the game already uses for portal unlocks and guardian rewards.

### ⛰ Seal of Depth — *go deep*

Reach floor `20 + 10 × evolutionCount` this life (capped at floor 250).

- 1st evolution: floor 20
- 10th evolution: floor 120
- 24th and beyond: floor 250

Tracked by a one-line ticker in the main update loop, so it works whether you climbed there normally,
recalled and returned, or pushed in through the Endless Ascent.

### 💠 Seal of Perfection — *be untouchable*

Kill a floor guardian **flawlessly** — it must not land a single hit on you for the entire fight.

This one reuses machinery that already existed: `G._bossClean` is set `true` when a guardian spawns
and flipped to `false` the moment you take damage while any boss is alive (it already fed the
"Perfection" living-tree mutation). The seal simply reads that flag on the kill. It's the seal that
actually tests play rather than persistence, and it does not get easier at higher ranks.

### The shatter rule

> **Dying shatters every seal you are holding.**

This is the single rule that makes the whole thing hard. Your level, your fame, your gear and your
evolution count all survive death as before — but your *proof* does not. The run that finally evolves
you has to be a clean one from the last death onward. It is recoverable (you keep everything that
matters) but it can't be brute-forced.

---

## 4. The price: fame

Fame is now a pure currency for this.

```js
evolveFameCost(n) = round(25000 × (n + 1)^1.35 / 500) × 500
```

| Evolution | Fame cost |
|---|---|
| 1st (n=0) | 25,000 |
| 4th | ~103,000 |
| 7th (Gray 7★ → Light Blue) | ~345,000 |
| 14th | ~880,000 |
| 21st | ~1.5 million |
| 49th (White 7★) | ~4.5 million |

For scale: a deep run currently banks somewhere in the tens of thousands of fame, and feats pay
hundreds to tens of thousands. So the first evolution is affordable the moment you hit the cap, and
the last one is a long-term project. Fame is *spent*, not just checked — `META.fame` is decremented,
which also means it competes with the fame you spend on stash slots and unsocketing gems.

---

## 5. What you actually get

Evolving:

- resets **level to 1** and XP to zero
- keeps **every attribute point** you have spent
- keeps **every talent** in the skill tree and your lifetime skill-point budget
- keeps **all equipment, your bag, your stash, your pets and your gold**
- consumes the three seals and the fame
- awards **+1 star**

Because attributes persist and levelling grants +1 attribute per level, each evolution effectively
hands you a fresh 255 attribute points and a fresh climb's worth of progression, up to the `ATTR_CAP`
of 999 per attribute. That is the reward loop: the stars are the badge, the stats are the payoff.

---

## 6. Where it lives in the code

All of this is in `towerlords.html`.

| Area | What's there |
|---|---|
| `evolveRank` / `fameRank` / `metaEvolves` / `evolveFameCost` / `rankProgressPct` | the rank ladder and the price curve, next to the old `STAR_TIERS` table |
| `sealBloodNeed` / `sealDepthNeed` / `sealState` / `sealsHeld` | seal thresholds and current status |
| `awardSealProgress(clean)` | called on a real guardian kill; advances Blood, sets Perfection |
| `tickDepthSeal()` | called each frame from `updateOverhaul`; advances Depth |
| `shatterSeals()` | called from `die()` |
| `canEvolve` / `evolveReady` / `evolveBlocker` / `evolvePrompt` / `evolve` | the gate, the confirmation dialog and the rebirth itself |
| `G.sealK` / `G.sealD` / `G.sealF` | per-character seal state — added to the per-player field set and to both save/serialise paths so it survives saves, loads and co-op sync |
| `META.evolves` | account-wide highest evolution count, persisted in localStorage |

### UI surfaces

- **Character panel (C)** — rank bar now reads "Rank · ★★★ 3/7 Gray · ✦×3 evolutions", fills with
  fame banked toward the next evolution, and shows three live seal chips underneath (green when
  earned). The Evolve button appears from the level cap onward and always opens the prompt, even when
  you can't afford it — so you can read the requirements.
- **Evolve prompt** — a confirmation dialog showing your current stars → next stars, a checklist of
  the three seals with live counts, the fame price, and the shatter warning. Nothing is spent until
  you confirm.
- **Score panel (V)** — the "Fame Rank" section became "Ascendant Rank" with the same seal chips and
  a full explanation of the ladder.
- **Bottom HUD strip** — reads `★ 3/7 · Gray · ✦×3 · next evolution 41%`.
- **Main menu badge** — shows tier, stars, evolution count, current fame and the next evolution's price.
- **Banners** — each seal fires its own banner and event-log line the moment it's earned, and tells
  you how many are left.

---

## 7. Design rationale

Three notes on why it's built this way rather than some other way:

**Why three separate seals instead of one big requirement?** Each one tests a different axis — volume
(Blood), commitment (Depth) and skill (Perfection) — so no single playstyle can shortcut the gate. A
player who only farms shallow floors fails Depth; a player who rushes deep fails Blood; a player who
does both but plays sloppily fails Perfection.

**Why does death shatter seals rather than, say, cost fame?** Because a fame penalty is just a tax
you pay and move on, whereas losing your proof forces the final approach to be deliberate. It also
gives death real stakes again for a max-level character, who otherwise has very little left to lose.

**Why keep the `fameRank()` name?** It's a 12,000-line single-file game with a dozen call sites for
the rank object across HUD, menus, co-op, leaderboards and a canvas renderer. Renaming would have
been churn with a real chance of missing one and shipping a crash. The function now delegates to
`evolveRank(metaEvolves())` and every existing caller keeps working unchanged.

---

## 8. Tuning knobs

If any of it feels wrong, these are the numbers to move — all in one place each:

```js
const EVOLVE_SEALS = 3;                                   // how many seals are required
function sealBloodNeed(n){ return Math.min(25, 3 + n); }  // guardians per life
function sealDepthNeed(n){ return Math.min(250, 20 + 10*n); }  // floor per life
function evolveFameCost(n){ ... 25000 * (n+1)^1.35 ... }  // the price curve
const MAX_EVOLVE = 49;                                    // total stars on the ladder
```

Making it easier: drop the Blood coefficient, flatten the Depth slope, or soften the shatter rule so
death only clears Blood and Perfection while Depth persists. Making it harder: require the flawless
kill to happen at or below a floor threshold, or demand two flawless kills at high rank.
