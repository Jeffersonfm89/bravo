// Marca pedido como pago e guarda a taxa real do Mercado Pago (fee_details / net_received_amount).
function markPaid(o, p) {
  o.pago = true; o.pagoEm = new Date().toISOString(); o.historico.push({ em: o.pagoEm, status: 'Pago (Pix)' });
  const fees = (p.fee_details || []).reduce((s, f) => s + Number(f.amount || 0), 0);
  const net = p.transaction_details && p.transaction_details.net_received_amount;
  if (fees > 0) o.mpTaxa = Math.round(fees * 100) / 100;
  else if (typeof net === 'number' && net > 0) o.mpTaxa = Math.round((Number(p.transaction_amount) - net) * 100) / 100;
}
module.exports = { markPaid };
