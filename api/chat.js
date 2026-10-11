// Chat do cliente. POST {action:start|send}, GET ?id=&token=&since=
const crypto = require('crypto');
const { cors, body, fail, bad, clean } = require('./_lib/common');
const { getChat, saveChat, getOrder, getSettings } = require('./_lib/store');
const { aiReply } = require('./_lib/ai');
const MAX_LEN = 500, MAX_MSGS = 300, MIN_GAP_MS = 1500;
const ipHits = new Map(); // limite por IP (melhor esforço, por instância)
function ipLimited(req, max) { const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const a = (ipHits.get(ip) || []).filter(t => now - t < 600e3); a.push(now); ipHits.set(ip, a); return a.length > max; }
const pub = c => ({ id: c.id, orderId: c.orderId, nome: c.nome, msgs: c.msgs, humano: c.humano });
async function auth(id, token) { const c = await getChat(id); if (!c || !token || c.token.length !== String(token).length || !crypto.timingSafeEqual(Buffer.from(c.token), Buffer.from(String(token)))) throw Object.assign(new Error('Conversa não encontrada'), { status: 404 }); return c; }
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') { const c = await auth(clean(req.query?.id, 20), clean(req.query?.token, 64)); if (c.unreadCliente) { c.unreadCliente = 0; await saveChat(c); } return res.json(pub(c)); }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
    const b = body(req);
    if (b.action === 'start') {
      if (ipLimited(req, 10)) return res.status(429).json({ error: 'Muitas conversas abertas. Tente mais tarde.' });
      const nome = clean(b.nome, 60); if (!nome) throw bad('Informe seu nome');
      const orderId = /^[A-Z0-9-]{6,40}$/.test(String(b.orderId || '')) ? String(b.orderId) : null;
      const c = { id: crypto.randomBytes(8).toString('hex'), token: crypto.randomBytes(16).toString('hex'), nome, tel: clean(b.tel, 30), orderId, criadoEm: new Date().toISOString(), msgs: [], unreadAdmin: 0, unreadCliente: 0, humano: false };
      await saveChat(c); return res.status(201).json({ id: c.id, token: c.token });
    }
    if (b.action === 'send') {
      const c = await auth(clean(b.id, 20), clean(b.token, 64));
      const txt = String(b.txt || '').trim().slice(0, MAX_LEN); if (!txt) throw bad('Mensagem vazia');
      const last = c.msgs.filter(m => m.de === 'cliente').slice(-1)[0];
      if (last && Date.now() - new Date(last.em) < MIN_GAP_MS) return res.status(429).json({ error: 'Calma 🙂 espere um instante para enviar outra mensagem' });
      if (c.msgs.length >= MAX_MSGS || ipLimited(req, 60)) return res.status(429).json({ error: 'Limite de mensagens atingido. Fale pelo WhatsApp.' });
      c.msgs.push({ de: 'cliente', txt, em: new Date().toISOString() }); c.unreadAdmin = (c.unreadAdmin || 0) + 1;
      if (!c.humano) { // resposta automática opcional (desligada por padrão)
        try { const st = await getSettings(); const o = c.orderId ? await getOrder(c.orderId) : null; const r = await aiReply(c, st, o);
          if (r) { c.msgs.push({ de: 'bot', txt: r.txt, em: new Date().toISOString() }); if (r.handoff) c.humano = true; } } catch (e) { console.error('ai', e.message); }
      }
      await saveChat(c); return res.json(pub(c));
    }
    throw bad('Ação inválida');
  } catch (e) { fail(res, e); }
};
