// Segurança: limite de tentativas (login do painel, criação de pedidos) e registro de eventos, no Vercel Blob.
const crypto = require('crypto');
const { getJSON, putJSON } = require('./store');
const h = s => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 24);
function ipOf(req) { return String(req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'desconhecido').trim().slice(0, 64); }
const day = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);   // dia em horário de Brasília
async function logEvent(type, data) {
  try { const key = `security/log/${day()}.json`; const l = (await getJSON(key)) || [];
    l.push({ em: new Date().toISOString(), type, ...data }); await putJSON(key, l.slice(-2000)); } catch (e) { console.error('seclog', e.message); }
}
async function readLog(days = 7) {
  const out = [];
  for (let i = 0; i < Math.min(Math.max(1, days), 31); i++) { const d = new Date(Date.now() - 3 * 3600e3 - i * 864e5).toISOString().slice(0, 10);
    const l = await getJSON(`security/log/${d}.json`).catch(() => null); if (l) out.push({ dia: d, eventos: l }); }
  return out;
}
// ---- login do painel: 5 erros por IP em 15 min => bloqueio de 15 min
const LOGIN_MAX = 5, LOGIN_WIN = 15 * 60e3, LOGIN_BLOCK = 15 * 60e3;
// agrupa por faixa de rede (IPv4 /24, IPv6 /64) para quem troca de IP na mesma rede não escapar do bloqueio
const net = ip => ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip.split('.').slice(0, 3).join('.');
const lkey = ip => `security/login/${h(net(ip))}.json`;
async function loginBlocked(ip) { const r = await getJSON(lkey(ip)).catch(() => null); return r && r.bloqueadoAte && r.bloqueadoAte > Date.now() ? r.bloqueadoAte : 0; }
async function loginFail(ip) {
  const r = (await getJSON(lkey(ip)).catch(() => null)) || {}; const now = Date.now();
  r.falhas = (r.falhas || []).filter(t => now - t < LOGIN_WIN).concat(now);
  let bloqueou = false; if (r.falhas.length >= LOGIN_MAX) { r.bloqueadoAte = now + LOGIN_BLOCK; r.falhas = []; bloqueou = true; }
  await putJSON(lkey(ip), r);
  await logEvent(bloqueou ? 'login_bloqueado' : 'login_falhou', { ip });
  return bloqueou ? r.bloqueadoAte : 0;
}
async function loginOk(ip) { const r = await getJSON(lkey(ip)).catch(() => null); if (r && (r.falhas || []).length) await putJSON(lkey(ip), {}); }
// ---- pedidos: máx. 3 em 10 min por telefone e por IP
const ORD_MAX = 3, ORD_WIN = 10 * 60e3;
async function orderLimit(ip, tel) {
  const now = Date.now(), keys = [`security/orders/ip-${h(ip)}.json`, `security/orders/tel-${h(String(tel).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))}.json`];
  const recs = await Promise.all(keys.map(k => getJSON(k).catch(() => null)));
  const lists = recs.map(r => ((r && r.t) || []).filter(t => now - t < ORD_WIN));
  if (lists.some(l => l.length >= ORD_MAX)) { await logEvent('pedidos_limite', { ip, tel: String(tel).slice(-4).padStart(8, '*') }); return false; }
  await Promise.all(keys.map((k, i) => putJSON(k, { t: lists[i].concat(now) })));
  return true;
}
module.exports = { ipOf, logEvent, readLog, loginBlocked, loginFail, loginOk, orderLimit };
