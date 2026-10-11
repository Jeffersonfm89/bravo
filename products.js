/* Lista de produtos e preços — usada pela loja E pelo servidor (o servidor recalcula o total). */
// ===== CARDÁPIO =====
// PREÇOS PROVISÓRIOS (placeholder) marcados com  // PROVISÓRIO  — troque pelos valores reais.
// Opções: grupos "single" (escolha 1) ou "multi" (várias); preço final = price + soma das opções escolhidas.
var PASTEL_IMG = "img/pastel.jpg";
function pastel(id, name, desc, price) { return { id: id, cat: "Pastéis", name: name, desc: desc, price: price, img: PASTEL_IMG }; }
var PRODUCTS = [
  pastel("p-frango", "Pastel de Frango", "Frango desfiado temperado", 9.00),                       // PROVISÓRIO
  pastel("p-frango-catupiry", "Pastel de Frango com Catupiry", "Frango desfiado e Catupiry", 11.00), // PROVISÓRIO
  pastel("p-frango-requeijao", "Pastel de Frango com Requeijão", "Frango desfiado e requeijão", 11.00), // PROVISÓRIO
  pastel("p-carne-ovo-queijo", "Pastel de Carne com Ovo e Queijo", "Carne moída, ovo e queijo", 12.00), // PROVISÓRIO
  pastel("p-queijo", "Pastel de Queijo", "Queijo mussarela", 9.00),                               // PROVISÓRIO
  pastel("p-pizza", "Pastel de Pizza", "Tomate, queijo mussarela, presunto, orégano e catupiry", 11.00), // PROVISÓRIO
  pastel("p-calabresa", "Pastel de Calabresa", "Calabresa", 9.00),                                // PROVISÓRIO
  pastel("p-calabresa-queijo", "Pastel de Calabresa com Queijo", "Calabresa e queijo mussarela", 11.00), // PROVISÓRIO
  pastel("p-calabresa-catupiry", "Pastel de Calabresa com Catupiry", "Calabresa e Catupiry", 11.00), // PROVISÓRIO
  pastel("p-bacon", "Pastel de Bacon", "Bacon", 10.00),                                           // PROVISÓRIO
  pastel("p-bacon-catupiry", "Pastel de Bacon com Catupiry", "Bacon e Catupiry", 12.00),          // PROVISÓRIO
  pastel("p-bacon-requeijao", "Pastel de Bacon com Requeijão", "Bacon e requeijão", 12.00),       // PROVISÓRIO
  { id: "p-personalizado", cat: "Pastéis", name: "Pastel Personalizado", desc: "Monte do seu jeito: escolha os ingredientes", price: 6.00, img: PASTEL_IMG, // base PROVISÓRIA
    options: [{ id: "ing", label: "Ingredientes", type: "multi", min: 1, max: 6, choices: [
      { id: "frango", name: "Frango", price: 2.00 }, { id: "carne", name: "Carne", price: 2.00 }, { id: "ovo", name: "Ovo", price: 1.50 },
      { id: "mussarela", name: "Queijo mussarela", price: 2.00 }, { id: "presunto", name: "Presunto", price: 2.00 }, { id: "calabresa", name: "Calabresa", price: 2.00 },
      { id: "bacon", name: "Bacon", price: 2.50 }, { id: "catupiry", name: "Catupiry", price: 2.00 }, { id: "requeijao", name: "Requeijão", price: 2.00 },
      { id: "tomate", name: "Tomate", price: 1.00 }, { id: "oregano", name: "Orégano", price: 0.50 }, { id: "milho", name: "Milho", price: 1.00 } ] }] }, // preços por ingrediente PROVISÓRIOS
  { id: "a-copo", ativo: false, cat: "Açaí", name: "Açaí no Copo", // DESATIVADO (ativo: false) — para reativar, apague "ativo: false"
    desc: "Escolha o tamanho e os adicionais", price: 0, img: "img/acai.jpg",
    options: [
      { id: "tam", label: "Tamanho", type: "single", min: 1, max: 1, choices: [
        { id: "300", name: "300ml", price: 12.00 }, { id: "400", name: "400ml", price: 15.00 }, { id: "500", name: "500ml", price: 18.00 } ] },
      { id: "add", label: "Adicionais", type: "multi", min: 0, max: 4, choices: [
        { id: "pacoca", name: "Paçoca", price: 3.00 }, { id: "mm", name: "M&M", price: 5.00 }, { id: "ninho", name: "Ninho", price: 3.00 }, { id: "banana", name: "Banana", price: 3.00 } ] } ] },
  { id: "a-garrafa", cat: "Açaí", name: "Açaí na Garrafa", desc: "Contém leite em pó e leite condensado.", price: 15.00, img: "img/acai-garrafa.jpg" }, // PROVISÓRIO
  { id: "b-coca-lata", cat: "Bebidas", name: "Coca-Cola Lata 350ml", desc: "Gelada", price: 6.00, img: "img/coca.jpg" },
  { id: "b-coca-600", cat: "Bebidas", name: "Coca-Cola 600ml", desc: "Gelada", price: 10.00, img: "img/coca.jpg" },
  { id: "b-coca-2l", cat: "Bebidas", name: "Coca-Cola 2L", desc: "Gelada", price: 16.00, img: "img/coca.jpg" },
];
/* Valida opções e calcula preço unitário + descrição ("300ml + Paçoca, Ninho"). Usado no site e no servidor. */
function priceItem(p, opts) {
  opts = opts || {}; var unit = p.price, parts = [], norm = {};
  Object.keys(opts).forEach(function (g) { if (!(p.options || []).some(function (x) { return x.id === g; })) throw new Error('Opção inválida em ' + p.name); });
  (p.options || []).forEach(function (g) {
    var sel = opts[g.id] || []; if (!Array.isArray(sel)) throw new Error('Opção inválida em ' + p.name);
    sel = sel.filter(function (v, i) { return sel.indexOf(v) === i; });
    if (sel.length < g.min) throw new Error('Escolha ' + g.label.toLowerCase() + ' para ' + p.name);
    if (sel.length > g.max) throw new Error('Máximo de ' + g.max + ' em ' + g.label.toLowerCase());
    var names = sel.map(function (cid) { var c = g.choices.find(function (x) { return x.id === cid; }); if (!c) throw new Error('Opção inválida em ' + p.name); unit += c.price; return c.name; });
    norm[g.id] = g.choices.filter(function (c) { return sel.indexOf(c.id) >= 0; }).map(function (c) { return c.id; });
    names = g.choices.filter(function (c) { return sel.indexOf(c.id) >= 0; }).map(function (c) { return c.name; });
    if (names.length) parts.push(g.type === 'single' ? names.join('') : (g.id === 'add' ? '+ ' : '') + names.join(', '));
  });
  return { unit: Math.round(unit * 100) / 100, detalhe: parts.join(' '), opts: norm };
}

/* Taxa de entrega: número (ex.: 5.00) = valor fixo; null = "a combinar". Retirada é sempre R$ 0,00.
   (Pronto para um futuro cálculo por bairro/distância: troque deliveryFee() abaixo.) */
var DELIVERY_FEE = null;
function deliveryFee(tipo) { return tipo === 'Retirada' ? 0 : DELIVERY_FEE; }
var ORDER_STATUSES = ['Recebido', 'Aceito', 'Em produção', 'Saiu para entrega', 'Pronto para retirada', 'Entregue', 'Cancelado'];
function brlFmt(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
/* Monta itens + subtotal + taxa + total (mesma regra no site e no servidor). */
function buildBreakdown(cartPairs, tipo, fee) {
  var itens = [], subtotal = 0;
  cartPairs.forEach(function (c) {
    var p = PRODUCTS.find(function (x) { return x.id === c.id; }); var q = Math.floor(Number(c.qty));
    if (!p || !(q >= 1 && q <= 99)) throw new Error('Item inválido: ' + c.id);
    if (p.ativo === false) throw new Error(p.name + ' está indisponível no momento');
    var pr = priceItem(p, c.opts);
    var s = Math.round(pr.unit * q * 100) / 100; subtotal += s;
    itens.push({ id: p.id, name: p.name, detalhe: pr.detalhe, opts: pr.opts, qty: q, unit: pr.unit, subtotal: s });
  });
  subtotal = Math.round(subtotal * 100) / 100;
  if (tipo === 'Retirada') fee = 0; else if (fee === undefined) fee = deliveryFee(tipo);
  return { itens: itens, subtotal: subtotal, taxaEntrega: fee, total: Math.round((subtotal + (fee || 0)) * 100) / 100 };
}
function feeLabel(fee) { return fee === null || fee === undefined ? 'a combinar' : brlFmt(fee); }
/* Texto do pedido (WhatsApp). */
function orderText(o, link) {
  var t = (o.pago ? '✅ *PAGO via Pix*\n' : '') + '*Pedido BRAVO' + (o.id ? ' nº ' + o.id : '') + '*\n\n';
  o.itens.forEach(function (i) { t += i.qty + 'x ' + i.name + (i.detalhe ? ' [' + i.detalhe + ']' : '') + ' (' + brlFmt(i.unit) + ' cada) = ' + brlFmt(i.subtotal) + '\n'; });
  t += '\nSubtotal: ' + brlFmt(o.subtotal) + '\nTaxa de entrega: ' + feeLabel(o.taxaEntrega) + '\n*Total: ' + brlFmt(o.total) + (o.taxaEntrega === null ? ' + entrega' : '') + (o.pago ? ' — PAGO' : '') + '*\n';
  var c = o.cliente || {};
  t += '\nNome: ' + c.nome + '\nTelefone: ' + c.tel + '\n' + (c.tipo === 'Retirada' ? 'Retirada no local' : 'Entrega: ' + c.end) + '\nPagamento: ' + o.pagamento;
  if (c.obs) t += '\nObs.: ' + c.obs;
  if (link) t += '\n\nAcompanhe o pedido: ' + link;
  return t;
}
if (typeof module !== 'undefined') module.exports = { PRODUCTS, priceItem, DELIVERY_FEE, deliveryFee, ORDER_STATUSES, buildBreakdown, orderText, brlFmt, feeLabel };
