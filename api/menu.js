// GET: cardápio público (padrões de products.js + alterações do painel). A loja lê daqui; o servidor usa o mesmo cardápio para cobrar.
const { cors, fail } = require('./_lib/common');
const { loadMenuInto } = require('./_lib/store');
const P = require('../products.js');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try { await loadMenuInto(P); const host = 'https://' + req.headers.host;
    const products = P.PRODUCTS.filter(p => p.ativo !== false).map(p => ({ ...p, img: /^\/api\/img/.test(p.img || '') ? host + p.img : p.img }));
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10'); res.json({ products });
  } catch (e) { fail(res, e); }
};
