// POST {tel}: cliente que volta em outro aparelho. Devolve SÓ primeiro nome e último endereço MASCARADO + addressRef opaco.
const { cors, body, fail, bad } = require('./_lib/common');
const { getCustomer } = require('./_lib/store');
const { makeRef, addrList, mask, digits } = require('./_lib/addr');
const hits = new Map();
function limited(k, max, win) { const now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < win); a.push(now); hits.set(k, a); if (hits.size > 5000) hits.clear(); return a.length > max; }
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', tel = digits(body(req).tel);
    if (tel.length < 10 || tel.length > 11) throw bad('Telefone inválido');
    if (limited('ip|' + ip, 8, 600e3) || limited('tel|' + tel, 5, 600e3)) return res.status(429).json({ error: 'Muitas consultas. Tente de novo em alguns minutos.' });
    const c = await getCustomer(tel); const a = c && addrList(c)[0];
    if (!c) return res.json({ found: false });
    res.json({ found: true, primeiroNome: String(c.nome || '').split(' ')[0].slice(0, 20), endereco: a ? { masked: mask(a), bairro: a.bairro, addressRef: makeRef(tel, a.id) } : null });
  } catch (e) { fail(res, e); }
};
