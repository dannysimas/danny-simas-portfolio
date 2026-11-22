const pageSize = 20;
const fields = 'id,name,body,created_at';
const validId = id => /^\d{1,20}$/.test(String(id));

export function validateComment({name, body}) {
  name = String(name || '').trim();
  body = String(body || '').trim();
  if (!name || name.length > 60 || !body || body.length > 800) throw new Error('invalid-comment');
  return {name, body};
}

export function createCommentClient({url, key, games, fetchImpl = fetch}) {
  const allowed = new Set(games);
  let base;
  try {
    base = new URL('/rest/v1/game_comments', url);
    if (base.protocol !== 'https:' || !base.hostname.endsWith('.supabase.co') || !key) base = null;
    // Only the existing public anonymous/publishable key belongs in this client.
    if (key?.startsWith('sb_secret_')) base = null;
    if (key?.startsWith('eyJ')) {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') base = null;
    }
  } catch { base = null; }
  function thread(game) {
    if (!allowed.has(game)) throw new Error('unknown-photomode');
    return `photomode:${game}`;
  }
  function normalize(row) {
    if (!row || !validId(row.id) || typeof row.name !== 'string' || typeof row.body !== 'string' || !Number.isFinite(Date.parse(row.created_at))) throw new Error('invalid-response');
    return {id: String(row.id), name: row.name, body: row.body, created_at: row.created_at};
  }
  async function request(params, options = {}) {
    if (!base) throw new Error('not-configured');
    const endpoint = new URL(base);
    endpoint.search = new URLSearchParams(params).toString();
    const response = await fetchImpl(endpoint.href, {
      ...options, cache: 'no-store',
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      headers: {apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...options.headers}
    });
    if (!response.ok) throw new Error('comment-request-failed');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('invalid-response');
    return rows.map(normalize);
  }
  return {
    configured: Boolean(base),
    async list(game, {before, signal} = {}) {
      const params = {game_id: `eq.${thread(game)}`, status: 'eq.approved', select: fields, order: 'id.desc', limit: String(pageSize + 1)};
      if (before != null) {if (!validId(before)) throw new Error('invalid-cursor');params.id = `lt.${before}`;}
      const rows = await request(params, {signal});
      return {comments: rows.slice(0, pageSize), next: rows.length > pageSize ? rows[pageSize - 1].id : null};
    },
    async post(game, values) {
      const game_id = thread(game), {name, body} = validateComment(values);
      if (values.website) throw new Error('invalid-comment');
      const rows = await request({select: fields}, {method: 'POST', headers: {Prefer: 'return=representation'},
        body: JSON.stringify({game_id, name, body, status: 'approved'})});
      if (rows.length !== 1) throw new Error('invalid-response');
      return rows[0];
    }
  };
}
