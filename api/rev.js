// GET: marcadores de mudança { o: pedidos, c: conversas }. O painel consulta isto (barato) e só baixa pedidos/conversas quando mudam.
// Fica 10s no cache da CDN da Vercel: vários aparelhos com o painel aberto = no máximo 1 leitura no Blob a cada 10s.
const { cors, fail } = require('./_lib/common');
const { getRevs } = require('./_lib/store');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try { const r = await getRevs(); res.setHeader('Vercel-CDN-Cache-Control', 'max-age=10'); res.setHeader('CDN-Cache-Control', 'max-age=10'); res.json(r); }
  catch (e) { fail(res, e); }
};
