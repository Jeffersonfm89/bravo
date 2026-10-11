// Dados no Vercel Blob (store privado "bravo-pedidos"): orders/<id>.json, customers/<tel>.json, config/settings.json
const { put, get, list } = require('@vercel/blob');
async function putJSON(key, obj) { await put(key, JSON.stringify(obj), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 }); return obj; }
async function getJSON(key) {
  const r = await get(key, { access: 'private', useCache: false }).catch(e => { if (e.name === 'BlobNotFoundError') return null; throw e; });
  if (!r || !r.stream) return null; return JSON.parse(await new Response(r.stream).text());
}
async function listKeys(prefix) { let blobs = [], cursor; do { const r = await list({ prefix, cursor, limit: 1000 }); blobs = blobs.concat(r.blobs); cursor = r.hasMore ? r.cursor : null; } while (cursor); return blobs; }
async function mapLimit(arr, n, fn) { const out = []; for (let i = 0; i < arr.length; i += n) out.push(...await Promise.all(arr.slice(i, i + n).map(fn))); return out; }
// ---- pedidos
const OKEY = id => `orders/${id}.json`;
async function saveOrder(o) { o.atualizadoEm = new Date().toISOString(); return putJSON(OKEY(o.id), o); }
async function getOrder(id) { if (!/^[A-Z0-9-]{6,40}$/.test(String(id))) return null; return getJSON(OKEY(id)); }
async function listOrders({ limit = 150, from } = {}) {
  let blobs = await listKeys('orders/');
  if (from) blobs = blobs.filter(b => new Date(b.uploadedAt) >= new Date(from));   // atualizados desde
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const os = (await mapLimit(blobs.slice(0, limit), 25, b => getJSON(b.pathname))).filter(Boolean);
  return os.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
// ---- clientes (chave = telefone só dígitos)
const telKey = t => String(t || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
async function touchCustomer(o, delta) { // delta: +1 novo pedido, -1 cancelado, +1 reativado
  const k = telKey(o.cliente.tel); if (!k) return;
  const key = `customers/${k}.json`; const c = (await getJSON(key)) || { tel: k, pedidos: 0, totalGasto: 0, criadoEm: new Date().toISOString() };
  c.pedidos = Math.max(0, c.pedidos + delta); c.totalGasto = Math.max(0, Math.round((c.totalGasto + delta * o.total) * 100) / 100);
  if (delta > 0 && (!c.ultimoPedido || o.criadoEm >= c.ultimoPedido)) {
    const x = o.cliente; c.nome = x.nome; c.telOriginal = x.tel;
    if (x.tipo === 'Entrega') c.endereco = { bairro: x.bairro, rua: x.rua, numero: x.numero, complemento: x.complemento, referencia: x.referencia, completo: x.end };
    c.ultimoPedido = o.criadoEm; c.ultimoPedidoId = o.id;
  }
  await putJSON(key, c);
}
async function listCustomers() { return (await mapLimit(await listKeys('customers/'), 25, b => getJSON(b.pathname))).filter(Boolean).sort((a, b) => String(b.ultimoPedido).localeCompare(String(a.ultimoPedido))); }
// ---- configurações (bairros/taxas, % Mercado Pago)
const { DEFAULT_BAIRROS } = require('../../bairros.js');
async function getSettings() {
  const s = (await getJSON('config/settings.json')) || {};
  if (!Array.isArray(s.bairros)) s.bairros = DEFAULT_BAIRROS.map(nome => ({ nome, taxa: null, ativo: true }));
  if (typeof s.mpPct !== 'number') s.mpPct = 0.99;
  return s;
}
const saveSettings = s => putJSON('config/settings.json', s);
// ---- conversas (chat)
const CKEY = id => `chats/${id}.json`;
const getChat = id => /^[a-f0-9]{16}$/.test(String(id)) ? getJSON(CKEY(id)) : null;
const saveChat = c => { c.atualizadoEm = new Date().toISOString(); return putJSON(CKEY(c.id), c); };
async function listChats() { return (await mapLimit(await listKeys('chats/'), 25, b => getJSON(b.pathname))).filter(Boolean).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm)); }
async function setOptOut(tel, v) { const k = telKey(tel), key = `customers/${k}.json`, c = await getJSON(key); if (!c) return null; c.optOut = !!v; await putJSON(key, c); return c; }
// ---- listas de chamada (reativação)
const LKEY = id => `lists/${id}.json`;
const getList = id => /^[a-f0-9]{12}$/.test(String(id)) ? getJSON(LKEY(id)) : null;
const saveList = l => { l.atualizadoEm = new Date().toISOString(); return putJSON(LKEY(l.id), l); };
async function allLists() { return (await mapLimit(await listKeys('lists/'), 25, b => getJSON(b.pathname))).filter(Boolean).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)); }
const { del } = require('@vercel/blob');
const delList = id => del(LKEY(id));
module.exports = { setOptOut, getList, saveList, allLists, delList, getChat, saveChat, listChats, saveOrder, getOrder, listOrders, touchCustomer, listCustomers, getSettings, saveSettings, telKey };
