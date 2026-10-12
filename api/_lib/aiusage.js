// Uso/custo da IA (OpenAI) por dia e por mês no Blob: ai-usage/AAAA-MM.json
const { getJSON, putJSON } = require('./store');
// Preços gpt-4o-mini (US$ por 1M tokens; conferidos em developers.openai.com/api/docs/pricing, out/2026). Editáveis no painel.
const DEF = { aiBudgetUsd: 5, aiPrices: { in: 0.15, cached: 0.075, out: 0.6 }, fxBrl: 5.5, aiStopPct: 90 };
const cfg = s => ({ budget: typeof s.aiBudgetUsd === 'number' ? s.aiBudgetUsd : DEF.aiBudgetUsd, prices: { ...DEF.aiPrices, ...(s.aiPrices || {}) }, fx: typeof s.fxBrl === 'number' ? s.fxBrl : DEF.fxBrl, stopPct: DEF.aiStopPct });
const brNow = () => new Date(Date.now() - 3 * 3600e3).toISOString();
const KEY = m => `ai-usage/${m}.json`;
async function getMonth(m) { return (await getJSON(KEY(m))) || { mes: m, dias: {} }; }
const blank = () => ({ calls: 0, replies: 0, erros: 0, in: 0, cached: 0, out: 0, usd: 0 });
async function record(st, usage, ok) {
  const d = brNow().slice(0, 10), m = d.slice(0, 7), u = await getMonth(m), day = u.dias[d] = u.dias[d] || blank(), p = cfg(st).prices;
  day.calls++; if (!ok) { day.erros++; } else {
    const inT = usage?.prompt_tokens || 0, cached = usage?.prompt_tokens_details?.cached_tokens || 0, out = usage?.completion_tokens || 0;
    day.replies++; day.in += inT; day.cached += cached; day.out += out;
    day.usd = Math.round((day.usd + ((inT - cached) * p.in + cached * p.cached + out * p.out) / 1e6) * 1e6) / 1e6;
  }
  await putJSON(KEY(m), u);
}
const sum = L => L.reduce((a, x) => { Object.keys(a).forEach(k => a[k] += x[k] || 0); return a; }, blank());
async function summary(st) {
  const c = cfg(st), d = brNow().slice(0, 10), u = await getMonth(d.slice(0, 7)), today = sum([u.dias[d] || {}]), month = sum(Object.values(u.dias));
  const dailyLimit = c.budget / 30, pct = c.budget ? month.usd / c.budget * 100 : 100;
  const r = x => ({ ...x, usd: Math.round(x.usd * 1e4) / 1e4, brl: Math.round(x.usd * c.fx * 100) / 100 });
  return { mes: u.mes, hoje: d, today: { ...r(today), pctDailyLimit: Math.round(today.usd / dailyLimit * 1000) / 10 }, month: r(month),
    budgetUsd: c.budget, dailySoftLimitUsd: Math.round(dailyLimit * 1e4) / 1e4, pctBudget: Math.round(pct * 10) / 10, stopAtPct: c.stopPct,
    blocked: pct >= c.stopPct, dailySoftExceeded: today.usd >= dailyLimit, prices: c.prices, fxBrl: c.fx, model: process.env.AI_MODEL || 'gpt-4o-mini',
    porDia: Object.keys(u.dias).sort().map(k => ({ dia: k, ...r(u.dias[k]) })) };
}
module.exports = { record, summary, cfg };
