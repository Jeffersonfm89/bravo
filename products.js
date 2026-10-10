/* Lista de produtos e preços — usada pela loja E pelo servidor (o servidor recalcula o total). */
// Preços de EXEMPLO — ajuste conforme a loja.
var PRODUCTS = [
  {id:"p-carne",cat:"Pastéis",name:"Pastel de Carne",desc:"Carne moída temperada",price:9.00,img:"img/pastel.jpg"},
  {id:"p-carneq",cat:"Pastéis",name:"Pastel de Carne com Queijo",desc:"Carne moída e muçarela",price:11.00,img:"img/pastel.jpg"},
  {id:"p-frango",cat:"Pastéis",name:"Pastel de Frango com Catupiry",desc:"Frango desfiado e Catupiry",price:11.00,img:"img/pastel.jpg"},
  {id:"p-queijo",cat:"Pastéis",name:"Pastel de Queijo",desc:"Muçarela derretida",price:9.00,img:"img/pastel.jpg"},
  {id:"p-pizza",cat:"Pastéis",name:"Pastel de Pizza",desc:"Muçarela, presunto, tomate e orégano",price:10.00,img:"img/pastel.jpg"},
  {id:"p-calab",cat:"Pastéis",name:"Pastel de Calabresa",desc:"Calabresa com queijo",price:10.00,img:"img/pastel.jpg"},
  {id:"p-palmito",cat:"Pastéis",name:"Pastel de Palmito",desc:"Palmito com queijo",price:11.00,img:"img/pastel.jpg"},
  {id:"p-choc",cat:"Pastéis",name:"Pastel de Chocolate",desc:"Doce, com chocolate ao leite",price:10.00,img:"img/pastel.jpg"},
  {id:"a-300",cat:"Açaí",name:"Açaí no Copo 300ml",desc:"Com granola, banana e leite condensado",price:15.00,img:"img/acai.jpg"},
  {id:"a-500",cat:"Açaí",name:"Açaí no Copo 500ml",desc:"Com granola, banana e leite condensado",price:22.00,img:"img/acai.jpg"},
  {id:"b-coca",cat:"Bebidas",name:"Coca-Cola Lata 350ml",desc:"Gelada",price:6.00,img:"img/coca.jpg"},
];

/* Taxa de entrega: número (ex.: 5.00) = valor fixo; null = "a combinar". Retirada é sempre R$ 0,00.
   (Pronto para um futuro cálculo por bairro/distância: troque deliveryFee() abaixo.) */
var DELIVERY_FEE = null;
function deliveryFee(tipo) { return tipo === 'Retirada' ? 0 : DELIVERY_FEE; }
var ORDER_STATUSES = ['Recebido', 'Aceito', 'Em produção', 'Saiu para entrega', 'Pronto para retirada', 'Entregue', 'Cancelado'];
function brlFmt(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
/* Monta itens + subtotal + taxa + total (mesma regra no site e no servidor). */
function buildBreakdown(cartPairs, tipo) {
  var itens = [], subtotal = 0;
  cartPairs.forEach(function (c) {
    var p = PRODUCTS.find(function (x) { return x.id === c.id; }); var q = Math.floor(Number(c.qty));
    if (!p || !(q >= 1 && q <= 99)) throw new Error('Item inválido: ' + c.id);
    var s = Math.round(p.price * q * 100) / 100; subtotal += s;
    itens.push({ id: p.id, name: p.name, qty: q, unit: p.price, subtotal: s });
  });
  subtotal = Math.round(subtotal * 100) / 100;
  var fee = deliveryFee(tipo);
  return { itens: itens, subtotal: subtotal, taxaEntrega: fee, total: Math.round((subtotal + (fee || 0)) * 100) / 100 };
}
function feeLabel(fee) { return fee === null || fee === undefined ? 'a combinar' : brlFmt(fee); }
/* Texto do pedido (WhatsApp). */
function orderText(o, link) {
  var t = (o.pago ? '✅ *PAGO via Pix*\n' : '') + '*Pedido BRAVO' + (o.id ? ' nº ' + o.id : '') + '*\n\n';
  o.itens.forEach(function (i) { t += i.qty + 'x ' + i.name + ' (' + brlFmt(i.unit) + ' cada) = ' + brlFmt(i.subtotal) + '\n'; });
  t += '\nSubtotal: ' + brlFmt(o.subtotal) + '\nTaxa de entrega: ' + feeLabel(o.taxaEntrega) + '\n*Total: ' + brlFmt(o.total) + (o.taxaEntrega === null ? ' + entrega' : '') + (o.pago ? ' — PAGO' : '') + '*\n';
  var c = o.cliente || {};
  t += '\nNome: ' + c.nome + '\nTelefone: ' + c.tel + '\n' + (c.tipo === 'Retirada' ? 'Retirada no local' : 'Entrega: ' + c.end) + '\nPagamento: ' + o.pagamento;
  if (c.obs) t += '\nObs.: ' + c.obs;
  if (link) t += '\n\nAcompanhe o pedido: ' + link;
  return t;
}
if (typeof module !== 'undefined') module.exports = { PRODUCTS, DELIVERY_FEE, deliveryFee, ORDER_STATUSES, buildBreakdown, orderText, brlFmt, feeLabel };
