// TOWERLORDS global leaderboard — Cloudflare Worker (free tier is plenty).
// Boards are JSON arrays in a KV namespace, capped at 200 entries each.
// Endpoints:
//   POST /submit  {board, id, name, score, floor?, kills?}  → {ok, rank}
//   GET  /top?board=fame|runs|daily:YYYY-MM-DD              → {list:[{id,name,score,floor,kills,when}...]}
// Deploy steps in LEADERBOARD_SETUP.md. Bind a KV namespace called LB.

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
};
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', ...CORS } });

const BOARD_RE = /^(fame|runs|daily:\d{4}-\d{2}-\d{2})$/;
const MAX_ENTRIES = 200;
const MAX_SCORE = 1e12; // sanity ceiling — beyond any legitimate play

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (url.pathname === '/top' && req.method === 'GET') {
      const board = url.searchParams.get('board') || '';
      if (!BOARD_RE.test(board)) return json({ error: 'bad board' }, 400);
      const list = JSON.parse((await env.LB.get('board:' + board)) || '[]');
      return json({ list: list.slice(0, 50) });
    }

    if (url.pathname === '/submit' && req.method === 'POST') {
      let b;
      try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const board = String(b.board || '');
      const id = String(b.id || '').slice(0, 32);
      const name = String(b.name || 'Climber').replace(/[<>&]/g, '').trim().slice(0, 20) || 'Climber';
      const score = Math.floor(Number(b.score) || 0);
      if (!BOARD_RE.test(board) || !/^[0-9a-f]{8,32}$/.test(id)) return json({ error: 'bad request' }, 400);
      if (!(score >= 0 && score < MAX_SCORE)) return json({ error: 'bad score' }, 400);

      const key = 'board:' + board;
      const list = JSON.parse((await env.LB.get(key)) || '[]');
      const entry = {
        id, name, score,
        floor: Math.min(9999, Math.floor(Number(b.floor) || 0)),
        kills: Math.min(999999, Math.floor(Number(b.kills) || 0)),
        when: Date.now(),
      };
      const i = list.findIndex(e => e.id === id);
      if (i >= 0) { if (score >= list[i].score) list[i] = entry; } // one row per player; best score wins
      else list.push(entry);
      list.sort((a, z) => z.score - a.score);
      if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
      await env.LB.put(key, JSON.stringify(list));
      return json({ ok: true, rank: list.findIndex(e => e.id === id) + 1 });
    }

    return json({ error: 'not found' }, 404);
  },
};
