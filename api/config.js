// GET: bairros atendidos e taxas (público, só ativos).
const { cors, fail } = require('./_lib/common');
const { getSettings } = require('./_lib/store');
let mem = null, memAt = 0; // 60s em memória + 60s na CDN: abrir a loja não lê o Blob toda vez
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try { if (!mem || Date.now() - memAt > 60e3) { mem = await getSettings(); memAt = Date.now(); } const s = mem; res.setHeader('Vercel-CDN-Cache-Control', 'max-age=60, stale-while-revalidate=300'); res.setHeader('CDN-Cache-Control', 'max-age=60, stale-while-revalidate=300');
    res.json({ pastelAdds: s.pastelAdds || null, bairros: s.bairros.filter(b => b.ativo).map(b => ({ nome: b.nome, taxa: b.taxa })) });
  } catch (e) { fail(res, e); }
};
