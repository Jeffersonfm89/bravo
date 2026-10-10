// Painel do dono: POST com header X-Admin-Password. Ações: list | setStatus {id,status}
const crypto = require('crypto');
const { cors, body, fail, bad } = require('./_lib/common');
const { saveOrder, getOrder, listOrders } = require('./_lib/store');
const { ORDER_STATUSES } = require('../products.js');
function authed(req) {
  const want = process.env.ADMIN_PASSWORD || ''; const got = String(req.headers['x-admin-password'] || '');
  if (!want) return false;
  const a = crypto.createHash('sha256').update(want).digest(), b = crypto.createHash('sha256').update(got).digest();
  return crypto.timingSafeEqual(a, b);
}
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  if (!authed(req)) { await new Promise(r => setTimeout(r, 800)); return res.status(401).json({ error: 'Senha incorreta' }); }
  try {
    const b = body(req); res.setHeader('Cache-Control', 'no-store');
    if (b.action === 'list') return res.json({ orders: (await listOrders(150)).map(({ pixQr, ...o }) => o), statuses: ORDER_STATUSES });
    if (b.action === 'setStatus') {
      if (!ORDER_STATUSES.includes(b.status)) throw bad('Status inválido');
      const o = await getOrder(String(b.id || '')); if (!o) return res.status(404).json({ error: 'Pedido não encontrado' });
      o.status = b.status; o.historico.push({ em: new Date().toISOString(), status: b.status });
      await saveOrder(o); const { pixQr, ...out } = o; return res.json(out);
    }
    throw bad('Ação inválida');
  } catch (e) { fail(res, e); }
};
