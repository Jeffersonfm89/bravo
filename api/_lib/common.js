const { PRODUCTS } = require('../../products.js');
const ALLOWED = ['https://jeffersonfm89.github.io', process.env.SITE_ORIGIN].filter(Boolean);
function cors(req, res) {
  const o = req.headers.origin || '';
  if (ALLOWED.includes(o) || /^https:\/\/bravo[a-z0-9-]*\.vercel\.app$/.test(o)) {
    res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
function priceCart(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) throw Object.assign(new Error('Carrinho inválido'), { status: 400 });
  let total = 0; const lines = [];
  for (const it of items) {
    const p = PRODUCTS.find(x => x.id === it.id); const q = Math.floor(Number(it.qty));
    if (!p || !(q >= 1 && q <= 99)) throw Object.assign(new Error('Item inválido: ' + it.id), { status: 400 });
    total += p.price * q; lines.push({ id: p.id, name: p.name, qty: q, unit: p.price });
  }
  return { total: Math.round(total * 100) / 100, lines };
}
const body = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const fail = (res, e) => { console.error(e.message, e.mp || ''); res.status(e.status || 500).json({ error: e.message }); };
module.exports = { cors, mp, priceCart, body, fail };
