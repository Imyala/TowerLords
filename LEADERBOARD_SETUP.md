# TOWERLORDS — Global Leaderboard Setup (~5 minutes, free)

The game ships with the leaderboard client built in but pointing nowhere
(`LEADERBOARD_URL = null` in `towerlords.html`). Deploy the tiny worker in
[leaderboard-worker.js](leaderboard-worker.js) to a free Cloudflare account,
paste the URL in, and every player's deaths/dailies start posting globally.

## Fastest path (2 commands)

```powershell
npx wrangler login          # opens a browser — sign in / create the free account, click Allow
.\deploy-leaderboard.ps1    # creates the KV namespace, fills wrangler.toml, deploys
```

Then paste the printed `https://towerlords-lb.<subdomain>.workers.dev` URL into
`LEADERBOARD_URL` in `towerlords.html` and rebuild the offline file.

## Manual dashboard path (if you prefer clicking)

1. **Create a Cloudflare account** (free): https://dash.cloudflare.com/sign-up
2. **Create the Worker**: Dashboard → *Workers & Pages* → *Create Worker* →
   name it `towerlords-lb` → *Deploy* → *Edit code* → replace the contents
   with `leaderboard-worker.js` → *Save and deploy*.
3. **Create the KV namespace**: Dashboard → *Workers & Pages* → *KV* →
   *Create namespace* → name it `towerlords-boards`.
4. **Bind it**: your worker → *Settings* → *Bindings* → *Add* →
   *KV namespace* → Variable name **`LB`** (exactly) → select
   `towerlords-boards` → *Save*. Redeploy if prompted.
5. **Point the game at it**: in `towerlords.html`, set

   ```js
   const LEADERBOARD_URL='https://towerlords-lb.<your-subdomain>.workers.dev';
   ```

   (the URL is shown on the worker's overview page), then rebuild the offline
   file (`node .claude/build-offline.js`).

## What it stores

Three kinds of boards, each a KV entry capped at 200 rows (one row per
player id, best score kept):

- `fame` — all-time fame (the star-rating currency)
- `runs` — best single run (floor × 100000 + kills × 100 + seconds)
- `daily:YYYY-MM-DD` — one board per Daily Climb date

Player identity is an anonymous random id generated in the browser
(`META.playerId`) plus a self-chosen display name (editable on the
leaderboard screen; sanitized server-side).

## Honest limitations (fine for v1)

- **Trust-the-client**: scores are self-reported. Fine while the community
  is friendly; real anti-cheat needs server-authoritative runs (the Phase-4
  co-op server would provide this).
- KV writes are last-write-wins; two simultaneous submissions can race.
  Harmless at small scale (worst case one entry lands next submission).
- Free tier: 100k requests/day — thousands of daily players before it costs
  a cent.
