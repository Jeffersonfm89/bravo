const crypto = require('crypto');
const { mp, body, fail } = require('./_lib/common');
const { getOrder, saveOrder } = require('./_lib/store');
const { markPaid } = require('./_lib/paid');
// Valida a assinatura x-signature se MP_WEBHOOK_SECRET estiver configurado (Mercado Pago > Webhooks > assinatura secreta).
function validSig(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET; if (!secret) return true;
  const sig = String(req.headers['x-signature'] || ''); const reqId = req.headers['x-request-id'] || '';
  const parts = Object.fromEntries(sig.split(',').map(s => s.trim().split('=')));
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${parts.ts};`;
  const h = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return parts.v1 && h.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(parts.v1));
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('ok');
  try {
    const b = body(req); const q = req.query || {};
    const id = String(b?.data?.id || q['data.id'] || q.id || '');
    const type = b.type || b.topic || q.type || q.topic;
    if (type && type !== 'payment') return res.status(200).json({ ignored: type });
    if (!/^\d{1,20}$/.test(id)) return res.status(200).json({ ignored: 'sem id' });
    if (!validSig(req, id)) return res.status(401).json({ error: 'assinatura inválida' });
    const p = await mp('/v1/payments/' + id);   // nunca confia no corpo: consulta o MP
    if (p.status === 'approved') {
      const o = p.external_reference && await getOrder(p.external_reference);
      if (o && !o.pago && Math.abs(Number(p.transaction_amount) - o.total) < 0.01) {
        o.pixStatus = 'approved'; markPaid(o, p);
        await saveOrder(o);
      }
      console.log('PEDIDO PAGO', p.external_reference, p.id, p.transaction_amount);
    }
    res.status(200).json({ id: p.id, status: p.status });
  } catch (e) { fail(res, e); }
};
