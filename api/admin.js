// Painel do dono: POST com header X-Admin-Password. Ações: list | setStatus {id,status}
const crypto = require('crypto');
const { cors, body, fail, bad } = require('./_lib/common');
const { setOptOut, getList, saveList, allLists, delList, getChat, saveChat, listChats, saveOrder, getOrder, listOrders, touchCustomer, listCustomers, getSettings, saveSettings } = require('./_lib/store');
const { ORDER_STATUSES, PASTEL_ADDS } = require('../products.js');
const { refreshPix } = require('./pedido.js');
const sec = require('./_lib/security');
function authed(req) {
  const want = process.env.ADMIN_PASSWORD || ''; const got = String(req.headers['x-admin-password'] || '');
  if (!want) return false;
  const a = crypto.createHash('sha256').update(want).digest(), b = crypto.createHash('sha256').update(got).digest();
  return crypto.timingSafeEqual(a, b);
}
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const ip = sec.ipOf(req);
  const until = await sec.loginBlocked(ip).catch(() => 0);
  if (until) { const min = Math.ceil((until - Date.now()) / 60e3); res.setHeader('Retry-After', String(min * 60)); return res.status(429).json({ error: `Muitas tentativas de senha. Tente de novo em ${min} min.` }); }
  if (!authed(req)) { await new Promise(r => setTimeout(r, 800)); const blk = await sec.loginFail(ip).catch(() => 0);
    if (blk) return res.status(429).json({ error: 'Muitas tentativas de senha. Acesso bloqueado por 15 min.' });
    return res.status(401).json({ error: 'Senha incorreta' }); }
  await sec.loginOk(ip).catch(() => {});
  try {
    const b = body(req); res.setHeader('Cache-Control', 'no-store');
    if (b.action === 'securityLog') return res.json({ log: await sec.readLog(Number(b.days) || 7) });
    if (b.action === 'list') {
      const os = await listOrders({ limit: 150 });
      // atualiza no Mercado Pago os Pix pendentes recentes (até 2h), caso o webhook não tenha chegado
      await Promise.all(os.filter(o => o.pixId && !o.pago && o.status !== 'Cancelado' && Date.now() - new Date(o.criadoEm) < 2 * 3600e3).map(o => refreshPix(o).catch(() => {})));
      return res.json({ orders: os.map(({ pixQr, ...o }) => o), statuses: ORDER_STATUSES });
    }
    if (b.action === 'liberar') {
      const o = await getOrder(String(b.id || '')); if (!o) return res.status(404).json({ error: 'Pedido não encontrado' });
      if (!o.liberadoManual) { o.liberadoManual = true; o.historico.push({ em: new Date().toISOString(), status: 'Liberado manualmente (Pix)' }); await saveOrder(o); }
      const { pixQr, ...out } = o; return res.json(out);
    }
    if (b.action === 'metrics') { // pedidos desde a data (para as métricas, calculadas no painel)
      const from = b.from && !isNaN(new Date(b.from)) ? b.from : null;
      const os = await listOrders({ limit: 5000, from });
      return res.json({ orders: os.filter(o => !from || o.criadoEm >= from).map(({ pixQr, historico, ...o }) => o), settings: { mpPct: (await getSettings()).mpPct } });
    }
    if (b.action === 'chats') return res.json({ chats: (await listChats()).map(c => ({ id: c.id, nome: c.nome, tel: c.tel, orderId: c.orderId, unreadAdmin: c.unreadAdmin || 0, n: c.msgs.length, last: c.msgs.slice(-1)[0] || null, atualizadoEm: c.atualizadoEm, humano: c.humano, precisaHumano: !!c.precisaHumano, fechado: !!c.fechado, fechadoEm: c.fechadoEm || null })) });
    if (b.action === 'chatGet' || b.action === 'chatReply') {
      const c = await getChat(String(b.id || '')); if (!c) return res.status(404).json({ error: 'Conversa não encontrada' });
      if (b.action === 'chatReply') { const txt = String(b.txt || '').trim().slice(0, 1000); if (!txt) throw bad('Mensagem vazia');
        c.msgs.push({ de: 'loja', txt, em: new Date().toISOString() }); c.unreadCliente = (c.unreadCliente || 0) + 1; c.humano = true; c.precisaHumano = false; }
      if (b.peek && b.action === 'chatGet') { const { token, ...out } = c; return res.json(out); } // só leitura (histórico do cliente)
      c.unreadAdmin = 0; await saveChat(c); const { token, ...out } = c; return res.json(out);
    }
    if (b.action === 'chatHumano') { const c = await getChat(String(b.id || '')); if (!c) return res.status(404).json({ error: 'Conversa não encontrada' });
      c.humano = !!b.humano; if (!c.humano) c.precisaHumano = false; await saveChat(c); const { token, ...out } = c; return res.json(out); }
    if (b.action === 'aiUsage') { const s = await getSettings(); return res.json({ ...(await require('./_lib/aiusage').summary(s)), aiAuto: s.aiAuto !== false, aiKey: !!process.env.AI_API_KEY }); }
    if (b.action === 'aiBudget') { const s = await getSettings(), n = v => Number(String(v).replace(',', '.'));
      if (b.budgetUsd !== undefined) { const v = n(b.budgetUsd); if (!(v >= 0 && v <= 1000)) throw bad('Orçamento inválido'); s.aiBudgetUsd = v; }
      if (b.fxBrl !== undefined) { const v = n(b.fxBrl); if (!(v > 1 && v < 20)) throw bad('Câmbio inválido'); s.fxBrl = v; }
      if (b.prices) { const p = {}; ['in', 'cached', 'out'].forEach(k => { if (b.prices[k] !== undefined) { const v = n(b.prices[k]); if (!(v >= 0 && v < 100)) throw bad('Preço inválido'); p[k] = v; } }); s.aiPrices = { ...(s.aiPrices || {}), ...p }; }
      await saveSettings(s); return res.json(await require('./_lib/aiusage').summary(s)); }
    if (b.action === 'chatClose') { const c = await getChat(String(b.id || '')); if (!c) return res.status(404).json({ error: 'Conversa não encontrada' });
      c.fechado = true; c.fechadoEm = new Date().toISOString(); c.unreadAdmin = 0; await saveChat(c); return res.json({ ok: true }); }
    if (b.action === 'chatDelete') { const c = await getChat(String(b.id || '')); if (!c) return res.status(404).json({ error: 'Conversa não encontrada' }); await require('@vercel/blob').del(`chats/${c.id}.json`); return res.json({ ok: true }); }
    if (b.action === 'setAi') { const s = await getSettings(); s.aiAuto = !!b.aiAuto; await saveSettings(s); return res.json({ aiAuto: s.aiAuto !== false, aiKey: !!process.env.AI_API_KEY }); }
    if (b.action === 'optOut') { const c = await setOptOut(b.tel, b.optOut); if (!c) return res.status(404).json({ error: 'Cliente não encontrado' }); return res.json(c); }
    if (b.action === 'lists') return res.json({ lists: await allLists() });
    if (b.action === 'listCreate' || b.action === 'listUpdate') {
      let l;
      if (b.action === 'listCreate') { const nome = String(b.nome || '').trim().slice(0, 60); if (!nome) throw bad('Dê um nome para a lista'); l = { id: crypto.randomBytes(6).toString('hex'), nome, template: 'Olá, {nome}! Sentimos sua falta aqui na Bravo 👑 Que tal um pastel hoje? Peça em ' + (process.env.SITE_URL || 'https://bravojoinville.com.br') + ' 😋', itens: [], criadoEm: new Date().toISOString() }; }
      else { l = await getList(b.id); if (!l) return res.status(404).json({ error: 'Lista não encontrada' }); }
      if (b.nome !== undefined && b.action === 'listUpdate') l.nome = String(b.nome).trim().slice(0, 60) || l.nome;
      if (b.template !== undefined) l.template = String(b.template).slice(0, 1000);
      if (Array.isArray(b.addTels) && b.addTels.length) {
        const cs = await listCustomers(), have = new Set(l.itens.map(i => i.tel));
        b.addTels.slice(0, 2000).forEach(t => { const c = cs.find(x => x.tel === String(t)); if (c && !c.optOut && !have.has(c.tel)) { l.itens.push({ tel: c.tel, nome: c.nome || '', enviadoEm: null }); have.add(c.tel); } });
      }
      if (b.removeTel) l.itens = l.itens.filter(i => i.tel !== String(b.removeTel));
      if (b.sentTel) l.itens.forEach(i => { if (i.tel === String(b.sentTel)) i.enviadoEm = b.unsent ? null : new Date().toISOString(); });
      await saveList(l); return res.json(l);
    }
    if (b.action === 'listDelete') { await delList(String(b.id || '')); return res.json({ ok: true }); }
    if (b.action === 'customers') return res.json({ customers: await listCustomers() });
    if (b.action === 'getSettings') { const s = await getSettings(); return res.json({ ...s, aiAuto: s.aiAuto !== false, aiKey: !!process.env.AI_API_KEY }); }
    if (b.action === 'saveSettings') {
      const s = await getSettings(), seen = new Set(), old = s.bairros;
      if (!Array.isArray(b.bairros) || b.bairros.length > 300) throw bad('Lista de bairros inválida');
      s.bairros = b.bairros.map(x => {
        const nome = String(x.nome || '').trim().slice(0, 60); if (!nome || seen.has(nome.toLowerCase())) return null; seen.add(nome.toLowerCase());
        let taxa = x.taxa === null || x.taxa === '' || x.taxa === undefined ? null : Math.round(Number(String(x.taxa).replace(',', '.')) * 100) / 100;
        if (taxa !== null && !(taxa >= 0 && taxa <= 500)) throw bad('Taxa inválida em ' + nome);
        return { nome, taxa, ativo: !!x.ativo };
      }).filter(Boolean);
      // bairros não podem ser excluídos: os que faltarem na lista enviada são mantidos como estavam
      s.bairros = s.bairros.concat(old.filter(x => !seen.has(x.nome.toLowerCase())));
      if (typeof b.aiAuto === 'boolean') s.aiAuto = b.aiAuto;
      if (b.pastelAdds && typeof b.pastelAdds === 'object') { const m = {}; PASTEL_ADDS.forEach(a => { const raw = b.pastelAdds[a.id]; if (raw === undefined || raw === '') return; const v = Number(String(raw).replace(',', '.')); if (!(v >= 0 && v <= 100)) throw bad('Preço inválido: ' + a.name); m[a.id] = Math.round(v * 100) / 100; }); s.pastelAdds = m; }
      const pct = Number(String(b.mpPct ?? s.mpPct).replace(',', '.')); if (!(pct >= 0 && pct <= 20)) throw bad('% Mercado Pago inválido'); s.mpPct = pct;
      await saveSettings(s); return res.json(s);
    }
    if (b.action === 'setStatus') {
      if (!ORDER_STATUSES.includes(b.status)) throw bad('Status inválido');
      const o = await getOrder(String(b.id || '')); if (!o) return res.status(404).json({ error: 'Pedido não encontrado' });
      const was = o.status === 'Cancelado', now = b.status === 'Cancelado';
      if (!['Recebido', 'Cancelado'].includes(b.status) && /^Pix/.test(o.pagamento) && !o.pago && !o.liberadoManual) throw bad('Pix ainda não pago: aguarde a confirmação ou use "Liberar manualmente"');
      if (b.status === 'Entregue' && b.pagamentoFinal !== undefined) { if (!['Pix', 'Dinheiro', 'Máquina de cartão'].includes(b.pagamentoFinal)) throw bad('Forma de pagamento inválida'); o.pagamentoFinal = b.pagamentoFinal; }
      o.status = b.status; o.historico.push({ em: new Date().toISOString(), status: b.status });
      await saveOrder(o); if (was !== now) await touchCustomer(o, now ? -1 : +1).catch(() => {});
      const { pixQr, ...out } = o; return res.json(out);
    }
    throw bad('Ação inválida');
  } catch (e) { fail(res, e); }
};
