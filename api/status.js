const { cors, mp, fail } = require('./_lib/common');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const id = String(req.query?.id || '');
  if (!/^\d{1,20}$/.test(id)) return res.status(400).json({ error: 'id inválido' });
  try { const p = await mp('/v1/payments/' + id); res.setHeader('Cache-Control', 'no-store');
    res.json({ id: p.id, status: p.status, status_detail: p.status_detail, amount: p.transaction_amount });
  } catch (e) { fail(res, e); }
};
