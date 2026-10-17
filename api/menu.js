// GET: cardápio público (padrões de products.js + alterações do painel). A loja lê daqui; o servidor usa o mesmo cardápio para cobrar.
const { cors, fail } = require('./_lib/common');
const { loadMenuInto } = require('./_lib/store');
const P = require('../products.js');
let memAt = 0; // cardápio em memória por 60s (instância reaproveitada não lê o Blob de novo)
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try { if (Date.now() - memAt > 60e3) { await loadMenuInto(P); memAt = Date.now(); } const host = 'https://' + req.headers.host;
    const products = P.PRODUCTS.filter(p => p.ativo !== false).map(p => ({ ...p, img: /^\/api\/img/.test(p.img || '') ? host + p.img : p.img }));
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=60, stale-while-revalidate=300'); res.setHeader('CDN-Cache-Control', 'max-age=60, stale-while-revalidate=300'); res.json({ products });
  } catch (e) { fail(res, e); }
};
