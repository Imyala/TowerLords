# TOWERLORDS — Online Co-op Plan (serverless, host-authoritative P2P)

Goal: let friends play together over the internet **without us running a game server** — one player **hosts** (runs the authoritative simulation), others **join** peer-to-peer. Builds on the existing local-coop foundation (`_G.players[]`, the `G` proxy, split-screen, drop-in, per-player menus).

---

## 1. The one honest caveat: "no server" needs a tiny "introduction" step

WebRTC (browser P2P) can connect two browsers directly with **no game server in the data path** — gameplay traffic flows host↔peer directly. BUT to *start* a connection the two browsers must swap a small handshake ("SDP offer/answer" + ICE candidates). That swap needs a channel. Options, cheapest first:

- **A. Manual code paste (truly zero infrastructure).** Host generates an offer string → sends it to the friend (Discord/text) → friend pastes it, generates an answer string → sends it back → host pastes it. Connected. Ugly but 100% serverless. Great for a **first prototype**.
- **B. Free signaling relay.** A tiny always-free WebSocket signaling service (e.g. PeerJS public broker, a 20-line Cloudflare Worker, or Firebase RTDB free tier) just to exchange the handshake, then peers talk directly. Not a *game* server — it sees only the handshake, then it's out of the loop. This is the **shippable** answer (host shares a short room code).
- **C. STUN/TURN.** Most home connections also need a free public **STUN** server (Google's is free) for NAT traversal. A small % of strict NATs need a **TURN relay** (does carry traffic) — only fallback; can defer.

**Recommendation:** prototype with **A** (manual paste) to prove the netcode, then add **B** (a free broker + room codes) for the real UX. Never need a paid game server.

---

## 2. Architecture: host-authoritative, input-relay

The host runs the **only** real simulation (the existing `update()` loop). Peers are basically **remote controllers + remote cameras**.

```
        ┌─────────────── HOST (authoritative sim) ───────────────┐
        │  runs update(dt): enemies, bullets, loot, collisions    │
        │  owns _G + all _G.players[]                              │
        └───────▲───────────────────────────────┬────────────────┘
                │ inputs (held keys/stick/buttons)│ world snapshots (10–20/s)
                │                                 ▼
        ┌───────┴─────────┐                ┌──────────────┐
        │  PEER 2 browser │  ... up to 4   │  PEER N       │
        │  sends input,   │                │  sends input, │
        │  renders snapshot                │  renders ...  │
        └─────────────────┘                └──────────────┘
```

- **Peers send up** a tiny input packet each frame: `{mx,mz, ax,az, atk, buttonEdges:{dash,q,e,r,f1,f2,f3,sig,interact,menu}}`. ~a few bytes.
- **Host applies** each peer's input to *their* `_G.players[i]` (exactly what `input.read()` does locally today), runs one authoritative `update()`, then **broadcasts a snapshot**.
- **Peers render** the snapshot in their own split-screen camera (camera follows *their* player). Peers do NOT simulate enemies/bullets — they just draw what the host sent + interpolate.

Why host-authoritative: no desync, no cheating headaches, dead simple vs lockstep. Cost: peers see ~half-RTT of input lag. Fine for a co-op PvE roguelite.

---

## 3. What goes in a snapshot (keep it small → send 12–20 Hz, interpolate between)

Send deltas where easy; full snapshot is fine to start. Per tick:

- **players[]**: id, x,z, rot, hp/maxhp, mana/maxmana, level, fervor, downed, dashT, color
- **enemies[]**: id, x,z, type(short), hp%, flags (elite/aggro), hitFlash — only ones near *any* player (cull by distance)
- **eProjectiles[] / projectiles[]**: id, x,z (spawn events are enough if peers extrapolate velocity) — OR just send spawn/despawn events + let peers move them by stored velocity (much cheaper)
- **pickups/loot**: spawn & grab events
- **fx events**: floatText, ringFx, banners, sfx triggers (so peers hear/see hits)
- **floor events**: floor gen seed + layout (send once per floor — peers rebuild the same map from the seed deterministically), portal state, shift timer

Bandwidth target: a few KB/tick at 15 Hz with ~40 enemies = ~tens of KB/s per peer. Trivial.

> Key trick already half-present: **map gen is seed-based** (`G.seed`, `G.layoutSalt`). Send the seed/salt and peers call `generateFloor()` locally → identical geometry with zero geometry streaming. Only *entities* stream.

---

## 4. How it maps onto the current code (low-friction integration points)

The codebase is already co-op-shaped — this is the payoff:

| Already there | Reuse for online |
|---|---|
| `_G.players[]` + `G` proxy routing per-player state | host keeps all players here; a peer's browser holds the same array but only *its* player is "real", others are render-only |
| `input.read(p)` per player | replace a remote player's `input` with a `netInput` whose `read()` copies the latest packet from the wire |
| `joinPlayer(padIndex)` | add `joinRemotePlayer(peerId)` — same player object, network input source |
| split-screen viewport render in `frame()` | peer renders **only its own** full-screen camera; host can render its own view |
| `updateWorldLabels`, co-op HUD tags, per-player menus | unchanged; menus stay local to each peer |
| seed-based `generateFloor` | host broadcasts seed → peers regenerate identical floors |

New modules to add:
- `net.js` (or an inline block): `NetHost` and `NetPeer` wrapping an `RTCPeerConnection` + a `RTCDataChannel` (unreliable/unordered for state, reliable for events).
- `serializeSnapshot()` / `applySnapshot()` — the wire format above.
- `netInput` input source (implements the same `{read(p)}` shape as `makePadInput`/`makeKbmInput`).
- A small **lobby-over-network** screen (reuse the new local-coop lobby UI; add "Host Game" → show room code, "Join Game" → enter code).

---

## 5. Build phases (each independently testable)

**Phase 0 — Refactor for headless authority (no networking yet).**
Make `update()` fully drive every player from `player.input` (it nearly does). Prove you can run a player purely by feeding an input packet into its `input`. *Test: a "bot" player driven by scripted packets.*

**Phase 1 — Two-browser data channel via manual paste (option A).**
Bare `RTCPeerConnection` + one `RTCDataChannel`. Host↔one peer. Send peer input up, send `{x,z}` of all players down, render the remote player as a colored capsule. *Test: two tabs, move both players, see each other.* This is the make-or-break netcode spike.

**Phase 2 — Full snapshot + interpolation.**
Stream enemies/projectiles/fx. Peers stop simulating world; interpolate positions between the last two snapshots (buffer ~100 ms). Seed-sync the floor. *Test: real combat looks smooth on the peer.*

**Phase 3 — Room codes via free broker (option B) + lobby UX.**
Replace manual paste with a signaling broker and a short room code in the existing lobby. "Host" / "Join with code". Up to 4 peers. *Test: friend joins from another network.*

**Phase 4 — Polish & resilience.**
Input prediction for the local player (move instantly, reconcile), lag compensation on hit-detection, peer disconnect/rejoin, drop-in mid-run, TURN fallback for strict NATs, anti-grief (host owns truth). 

**Phase 5 (optional) — Dedicated server.**
Only if you later want public matchmaking / persistent worlds / leaderboards integrity. Same authoritative model, just the server is the authority instead of a player. Not required for friends-co-op.

---

## 6. Risks & mitigations
- **Host advantage / host leaves = game ends.** Acceptable for friend co-op (like Terraria/Valheim P2P). Mitigate later with host-migration (hard) or accept it.
- **NAT traversal failures.** Add a free TURN relay as fallback (Phase 4).
- **Lag feel on peers.** Local input prediction for your own movement (Phase 4) hides most of it; PvE is forgiving.
- **Scope.** This is genuinely multi-session. Phases 0–2 are the real spike; if those feel good, the rest is mostly UX + hardening.

---

## 7. Suggested first move
Do **Phase 0 + Phase 1** as a focused spike: two tabs, manual-paste WebRTC, exchange player positions only. If that's smooth, we commit to Phases 2–3. Want me to start Phase 0 (the headless-authority refactor + a scripted bot player to prove input-driven players) next session?
