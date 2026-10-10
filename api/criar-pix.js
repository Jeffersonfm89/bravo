const crypto = require('crypto');
const { cors, mp, priceCart, body, fail } = require('./_lib/common');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  try {
    const b = body(req); const c = b.cliente || {};
    const { total, lines } = priceCart(b.items);   // preço SEMPRE do servidor
    const host = process.env.PUBLIC_API_URL || ('https://' + req.headers.host);
    const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '') ? c.email : (process.env.PAYER_FALLBACK_EMAIL || 'cliente@bravo.com.br');
    const pay = await mp('/v1/payments', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': b.idempotencyKey && /^[\w-]{8,64}$/.test(b.idempotencyKey) ? b.idempotencyKey : crypto.randomUUID() },
      body: JSON.stringify({
        transaction_amount: total, payment_method_id: 'pix',
        description: 'Pedido Bravo: ' + lines.map(l => l.qty + 'x ' + l.name).join(', ').slice(0, 200),
        payer: { email, first_name: String(c.nome || '').slice(0, 60) },
        notification_url: host + '/api/webhook',
        date_of_expiration: new Date(Date.now() + 30 * 60e3).toISOString().replace('Z', '-00:00'),
        metadata: { telefone: String(c.tel || '').slice(0, 30), itens: lines },
      }),
    });
    const t = pay.point_of_interaction?.transaction_data || {};
    res.status(201).json({ id: pay.id, status: pay.status, amount: pay.transaction_amount, qr_code: t.qr_code, qr_code_base64: t.qr_code_base64, ticket_url: t.ticket_url });
  } catch (e) { fail(res, e); }
};
