// GET: bairros atendidos e taxas (público, só ativos).
const { cors, fail } = require('./_lib/common');
const { getSettings } = require('./_lib/store');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try { const s = await getSettings(); res.setHeader('Cache-Control', 'public, max-age=30');
    res.json({ pastelAdds: s.pastelAdds || null, bairros: s.bairros.filter(b => b.ativo).map(b => ({ nome: b.nome, taxa: b.taxa })) });
  } catch (e) { fail(res, e); }
};
