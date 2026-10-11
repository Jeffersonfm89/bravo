// Painel do dono: POST com header X-Admin-Password. Ações: list | setStatus {id,status}
const crypto = require('crypto');
const { cors, body, fail, bad } = require('./_lib/common');
const { saveOrder, getOrder, listOrders, touchCustomer, listCustomers, getSettings, saveSettings } = require('./_lib/store');
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
    if (b.action === 'list') return res.json({ orders: (await listOrders({ limit: 150 })).map(({ pixQr, ...o }) => o), statuses: ORDER_STATUSES });
    if (b.action === 'metrics') { // pedidos desde a data (para as métricas, calculadas no painel)
      const from = b.from && !isNaN(new Date(b.from)) ? b.from : null;
      const os = await listOrders({ limit: 5000, from });
      return res.json({ orders: os.filter(o => !from || o.criadoEm >= from).map(({ pixQr, historico, ...o }) => o), settings: { mpPct: (await getSettings()).mpPct } });
    }
    if (b.action === 'customers') return res.json({ customers: await listCustomers() });
    if (b.action === 'getSettings') return res.json(await getSettings());
    if (b.action === 'saveSettings') {
      const s = await getSettings(), seen = new Set();
      if (!Array.isArray(b.bairros) || b.bairros.length > 300) throw bad('Lista de bairros inválida');
      s.bairros = b.bairros.map(x => {
        const nome = String(x.nome || '').trim().slice(0, 60); if (!nome || seen.has(nome.toLowerCase())) return null; seen.add(nome.toLowerCase());
        let taxa = x.taxa === null || x.taxa === '' || x.taxa === undefined ? null : Math.round(Number(String(x.taxa).replace(',', '.')) * 100) / 100;
        if (taxa !== null && !(taxa >= 0 && taxa <= 500)) throw bad('Taxa inválida em ' + nome);
        return { nome, taxa, ativo: !!x.ativo };
      }).filter(Boolean);
      const pct = Number(String(b.mpPct ?? s.mpPct).replace(',', '.')); if (!(pct >= 0 && pct <= 20)) throw bad('% Mercado Pago inválido'); s.mpPct = pct;
      await saveSettings(s); return res.json(s);
    }
    if (b.action === 'setStatus') {
      if (!ORDER_STATUSES.includes(b.status)) throw bad('Status inválido');
      const o = await getOrder(String(b.id || '')); if (!o) return res.status(404).json({ error: 'Pedido não encontrado' });
      const was = o.status === 'Cancelado', now = b.status === 'Cancelado';
      o.status = b.status; o.historico.push({ em: new Date().toISOString(), status: b.status });
      await saveOrder(o); if (was !== now) await touchCustomer(o, now ? -1 : +1).catch(() => {});
      const { pixQr, ...out } = o; return res.json(out);
    }
    throw bad('Ação inválida');
  } catch (e) { fail(res, e); }
};
