// POST: cria pedido (qualquer forma de pagamento; Pix gera cobrança no Mercado Pago).
// GET ?id=: dados do pedido para a página de acompanhamento (atualiza status do Pix no MP se ainda não pago).
const crypto = require('crypto');
const { cors, mp, body, fail, bad, clean } = require('./_lib/common');
const { saveOrder, getOrder, touchCustomer, getSettings } = require('./_lib/store');
const { markPaid } = require('./_lib/paid');
const { buildBreakdown } = require('../products.js');
const PAGS = ['Pix', 'Cartão', 'Dinheiro na entrega'];
function newId() { const d = new Date(Date.now() - 3 * 3600e3); return d.toISOString().slice(2, 10).replace(/-/g, '') + '-' + crypto.randomBytes(4).toString('hex').toUpperCase(); }
function publicView(o) { const { pixQr, ...rest } = o; return rest; }
async function refreshPix(o) {
  if (!o.pixId || o.pago) return o;
  const p = await mp('/v1/payments/' + o.pixId);
  if (p.status !== o.pixStatus) { o.pixStatus = p.status; if (p.status === 'approved') markPaid(o, p); await saveOrder(o); }
  return o;
}
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const o = await getOrder(clean(req.query?.id, 40).toUpperCase()); if (!o) return res.status(404).json({ error: 'Pedido não encontrado' });
      await refreshPix(o).catch(e => console.error('refreshPix', e.message));
      res.setHeader('Cache-Control', 'no-store'); return res.json({ ...publicView(o), pix: o.pixQr && !o.pago ? o.pixQr : undefined });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
    const b = body(req), c = b.cliente || {};
    const cliente = { nome: clean(c.nome, 80), tel: clean(c.tel, 30), email: clean(c.email, 120), tipo: c.tipo === 'Retirada' ? 'Retirada' : 'Entrega', obs: clean(c.obs, 300) };
    if (!cliente.nome || cliente.tel.replace(/\D/g, '').length < 10) throw bad('Informe nome e telefone com DDD');
    let fee = 0;
    if (cliente.tipo === 'Entrega') {
      Object.assign(cliente, { bairro: clean(c.bairro, 60), rua: clean(c.rua, 120), numero: clean(c.numero, 20), complemento: clean(c.complemento, 80), referencia: clean(c.referencia, 120) });
      if (!cliente.rua || !cliente.numero) throw bad('Informe rua e número');
      const st = await getSettings(); const bz = st.bairros.find(x => x.nome === cliente.bairro && x.ativo);
      if (!bz) throw bad('Bairro não atendido: escolha um bairro da lista');
      fee = typeof bz.taxa === 'number' ? bz.taxa : null;   // taxa SEMPRE do servidor
      cliente.end = `${cliente.rua}, ${cliente.numero}${cliente.complemento ? ' - ' + cliente.complemento : ''} - ${cliente.bairro}, Joinville${cliente.referencia ? ' (Ref.: ' + cliente.referencia + ')' : ''}`;
    }
    const pagamento = PAGS.includes(b.pagamento) ? b.pagamento : null; if (!pagamento) throw bad('Forma de pagamento inválida');
    if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) throw bad('Carrinho inválido');
    let br; try { br = buildBreakdown(b.items, cliente.tipo, fee); } catch (e) { throw bad(e.message); }   // preços SEMPRE do servidor
    const now = new Date().toISOString();
    const o = { id: newId(), criadoEm: now, status: 'Recebido', pago: false, pagamento, cliente, ...br, historico: [{ em: now, status: 'Recebido' }] };
    if (pagamento === 'Pix') {
      const host = process.env.PUBLIC_API_URL || ('https://' + req.headers.host);
      const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cliente.email) ? cliente.email : (process.env.PAYER_FALLBACK_EMAIL || 'cliente@bravo.com.br');
      let pay; try { pay = await mp('/v1/payments', {
        method: 'POST', headers: { 'X-Idempotency-Key': o.id },
        body: JSON.stringify({
          transaction_amount: o.total, payment_method_id: 'pix', external_reference: o.id,
          description: 'Pedido Bravo nº ' + o.id, payer: { email, first_name: cliente.nome.slice(0, 60) },
          notification_url: host + '/api/webhook',
          date_of_expiration: new Date(Date.now() + 30 * 60e3).toISOString().replace('Z', '-00:00'),
        }),
      }); } catch (e) { console.error('Pix MP falhou', e.message, e.mp || ''); o.pixErro = true; o.pagamento = 'Pix (combinar com a loja)'; }
      if (pay) { const t = pay.point_of_interaction?.transaction_data || {};
      o.pixId = String(pay.id); o.pixStatus = pay.status; o.pixQr = { qr_code: t.qr_code, qr_code_base64: t.qr_code_base64 }; }
    }
    await saveOrder(o);
    await touchCustomer(o, +1).catch(e => console.error('cliente', e.message));
    res.status(201).json({ ...publicView(o), pix: o.pixQr });
  } catch (e) { fail(res, e); }
};
module.exports.refreshPix = refreshPix;
