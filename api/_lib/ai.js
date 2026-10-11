// Gancho OPCIONAL de resposta automática por IA no chat. DESLIGADO por padrão.
// Só roda se: painel > Conversas > "Resposta automática (IA)" ligado  E  env AI_API_KEY definido.
// Usa API compatível com OpenAI Chat Completions: AI_API_URL (padrão https://api.openai.com/v1/chat/completions) e AI_MODEL.
const { PRODUCTS, brlFmt } = require('../../products.js');
function menuText() {
  return PRODUCTS.filter(p => p.ativo !== false).map(p => `- ${p.name}: ${brlFmt(p.price)}${p.desc ? ' (' + p.desc + ')' : ''}` +
    (p.options || []).map(g => `; ${g.label}: ` + g.choices.map(c => c.name + (c.price ? ' +' + brlFmt(c.price) : '')).join(', ')).join('')).join('\n');
}
async function aiReply(chat, settings, order) {
  if (!settings.aiAuto || !process.env.AI_API_KEY) return null;
  const fees = settings.bairros.filter(b => b.ativo).map(b => `${b.nome}: ${b.taxa == null ? 'a combinar' : brlFmt(b.taxa)}`).join('; ');
  const sys = `Você é o atendente virtual da lanchonete Bravo (Joinville-SC). Responda em português, curto e simpático.
Use SOMENTE estas informações. Cardápio:\n${menuText()}\nTaxas de entrega por bairro: ${fees}. Retirada no local: grátis.
${order ? `Pedido do cliente nº ${order.id}: status "${order.status}", total ${brlFmt(order.total)}, pagamento ${order.pagamento}${order.pago ? ' (pago)' : ''}.` : ''}
Pedidos são feitos pelo site. Se não souber, se for reclamação, cancelamento, troca ou o cliente pedir uma pessoa, responda que vai chamar um atendente e inclua [HUMANO] no fim.`;
  const msgs = [{ role: 'system', content: sys }].concat(chat.msgs.slice(-12).map(m => ({ role: m.de === 'cliente' ? 'user' : 'assistant', content: m.txt })));
  const r = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.AI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', messages: msgs, max_tokens: 250, temperature: 0.3 }), signal: AbortSignal.timeout(7000) });
  if (!r.ok) throw new Error('IA ' + r.status);
  let txt = ((await r.json()).choices?.[0]?.message?.content || '').trim(); if (!txt) return null;
  const handoff = txt.includes('[HUMANO]'); txt = txt.replace('[HUMANO]', '').trim().slice(0, 600);
  return { txt, handoff };
}
module.exports = { aiReply };
