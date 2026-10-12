const ALLOWED = ['https://jeffersonfm89.github.io', 'https://bravojoinville.com.br', 'https://www.bravojoinville.com.br', process.env.SITE_ORIGIN].filter(Boolean);
function cors(req, res) {
  const o = req.headers.origin || '';
  if (ALLOWED.includes(o) || /^https:\/\/bravo[a-z0-9-]*\.vercel\.app$/.test(o)) {
    res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
function token() { const t = process.env.MP_ACCESS_TOKEN; if (!t) throw Object.assign(new Error('MP_ACCESS_TOKEN não configurado'), { status: 500 }); return t; }
async function mp(path, opts = {}) {
  const r = await fetch('https://api.mercadopago.com' + path, { ...opts, headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.message || 'Erro Mercado Pago'), { status: 502, mp: data });
  return data;
}
const body = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const fail = (res, e) => { console.error(e.message, e.mp || ''); res.status(e.status || 500).json({ error: e.message }); };
const bad = m => Object.assign(new Error(m), { status: 400 });
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
module.exports = { cors, mp, body, fail, bad, clean };
