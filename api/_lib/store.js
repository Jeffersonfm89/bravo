// Pedidos guardados no Vercel Blob (store privado "bravo-pedidos"), um JSON por pedido.
const { put, get, list } = require('@vercel/blob');
const KEY = id => `orders/${id}.json`;
async function saveOrder(o) {
  o.atualizadoEm = new Date().toISOString();
  await put(KEY(o.id), JSON.stringify(o), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
  return o;
}
async function getOrder(id) {
  if (!/^[A-Z0-9-]{6,40}$/.test(String(id))) return null;
  const r = await get(KEY(id), { access: 'private', useCache: false }).catch(e => { if (e.name === 'BlobNotFoundError') return null; throw e; });
  if (!r || !r.stream) return null;
  return JSON.parse(await new Response(r.stream).text());
}
async function listOrders(limit = 100) {
  let blobs = [], cursor;
  do { const r = await list({ prefix: 'orders/', cursor, limit: 1000 }); blobs = blobs.concat(r.blobs); cursor = r.hasMore ? r.cursor : null; } while (cursor);
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const ids = blobs.slice(0, limit).map(b => b.pathname.slice(7, -5));
  return (await Promise.all(ids.map(getOrder))).filter(Boolean).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
module.exports = { saveOrder, getOrder, listOrders };
