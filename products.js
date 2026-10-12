/* Lista de produtos e preços — usada pela loja E pelo servidor (o servidor recalcula o total). */
// ===== CARDÁPIO =====
// Estes são os valores PADRÃO. O dono edita nome/preço/foto/descrição no painel (aba Cardápio); as mudanças ficam no Blob (config/menu.json) e são aplicadas por applyMenu().
// Opções: grupos "single" (escolha 1) ou "multi" (várias); preço final = price + soma das opções escolhidas.
var PASTEL_IMG = "img/pastel.jpg";
// Adicionais de pastel (preço editável no painel > Taxas de entrega > "Adicionais de pastel"; este é o padrão)
var PASTEL_ADDS = [
  { id: "calabresa", name: "Calabresa", price: 8.00 }, { id: "queijo", name: "Queijo", price: 8.00 }, { id: "bacon", name: "Bacon", price: 8.00 },
  { id: "pizza", name: "Pizza (tomate, mussarela, presunto, orégano)", price: 8.00 }, { id: "frango", name: "Frango", price: 8.00 } ];
function addsGroup() { return { id: "add", padds: true, label: "Adicionais", type: "multi", min: 0, max: PASTEL_ADDS.length, choices: PASTEL_ADDS }; }
function semGroup(ings) { return { id: "sem", label: "Tirar algo", type: "multi", min: 0, max: ings.length, choices: ings.map(function (n) { return { id: n.toLowerCase().normalize("NFD").replace(/[^a-z]/g, ""), name: "Sem " + n, price: 0 }; }) }; }
// ings = ingredientes do próprio pastel (viram as opções de "Tirar algo")
// Tamanho do pastel (obrigatório): G = preço informado, M = G − R$ 5. O preço base fica 0.
function tamGroup(g) { return { id: "tam", label: "Tamanho", type: "single", min: 1, max: 1, choices: [{ id: "M", name: "Médio (M)", price: Math.round((g - 5) * 100) / 100 }, { id: "G", name: "Grande (G)", price: g }] }; }
function pastel(id, name, desc, price, ings) { return { id: id, cat: "Pastéis", name: name, desc: desc, price: 0, img: "img/" + id + ".jpg", nota: true, options: [tamGroup(price), semGroup(ings), addsGroup()] }; }
/* Aplica preços de adicionais salvos no painel: { calabresa: 8, ... } */
function applyAddPrices(map) { if (!map) return; var setP = function (a) { var v = Number(map[a.id]); if (map[a.id] != null && map[a.id] !== '' && v >= 0 && v <= 100) a.price = Math.round(v * 100) / 100; };
  PASTEL_ADDS.forEach(setP); if (typeof PRODUCTS !== 'undefined') PRODUCTS.forEach(function (p) { (p.options || []).forEach(function (g) { if (g.padds) g.choices.forEach(setP); }); }); }
var PRODUCTS = [
  pastel("p-frango", "Pastel de Frango", "Frango desfiado temperado", 17.00, ["Frango"]),
  pastel("p-frango-catupiry", "Pastel de Frango com Catupiry", "Frango desfiado e Catupiry", 17.00, ["Frango", "Catupiry"]),
  pastel("p-frango-requeijao", "Pastel de Frango com Requeijão", "Frango desfiado e requeijão", 19.00, ["Frango", "Requeijão"]),
  pastel("p-carne-ovo-queijo", "Pastel de Carne com Ovo e Queijo", "Carne moída, ovo e queijo", 17.00, ["Carne", "Ovo", "Queijo"]),
  pastel("p-queijo", "Pastel de Queijo", "Queijo mussarela", 18.00, ["Queijo"]),
  pastel("p-pizza", "Pastel de Pizza", "Tomate, queijo mussarela, presunto, orégano e catupiry", 17.00, ["Tomate", "Queijo", "Presunto", "Orégano", "Catupiry"]),
  pastel("p-calabresa", "Pastel de Calabresa", "Calabresa", 17.00, ["Calabresa"]),
  pastel("p-calabresa-queijo", "Pastel de Calabresa com Queijo", "Calabresa e queijo mussarela", 17.00, ["Calabresa", "Queijo"]),
  pastel("p-calabresa-catupiry", "Pastel de Calabresa com Catupiry", "Calabresa e Catupiry", 17.00, ["Calabresa", "Catupiry"]),
  pastel("p-bacon", "Pastel de Bacon", "Bacon", 18.00, ["Bacon"]),
  pastel("p-bacon-catupiry", "Pastel de Bacon com Catupiry", "Bacon e Catupiry", 18.00, ["Bacon", "Catupiry"]),
  pastel("p-bacon-requeijao", "Pastel de Bacon com Requeijão", "Bacon e requeijão", 18.00, ["Bacon", "Requeijão"]),
  { id: "p-personalizado", cat: "Pastéis", name: "Pastel Personalizado", desc: "Monte do seu jeito: escolha até 4 ingredientes", price: 20.00, img: "img/p-personalizado.jpg", nota: true,
    options: [{ id: "ing", label: "Ingredientes", type: "multi", min: 1, max: 4, choices: [
      { id: "frango", name: "Frango", price: 0 }, { id: "carne", name: "Carne", price: 0 }, { id: "ovo", name: "Ovo", price: 0 },
      { id: "mussarela", name: "Queijo mussarela", price: 0 }, { id: "presunto", name: "Presunto", price: 0 }, { id: "calabresa", name: "Calabresa", price: 0 },
      { id: "bacon", name: "Bacon", price: 0 }, { id: "catupiry", name: "Catupiry", price: 0 }, { id: "requeijao", name: "Requeijão", price: 0 },
      { id: "tomate", name: "Tomate", price: 0 }, { id: "oregano", name: "Orégano", price: 0 }, { id: "milho", name: "Milho", price: 0 } ] }, addsGroup()] },
  { id: "a-copo", cat: "Açaí", name: "Açaí no Copo",
    desc: "Escolha o tamanho e os adicionais", price: 0, img: "img/acai.jpg",
    options: [
      { id: "tam", label: "Tamanho", type: "single", min: 1, max: 1, choices: [
        { id: "300", name: "300ml", price: 12.00 }, { id: "400", name: "400ml", price: 15.00 }, { id: "500", name: "500ml", price: 18.00 } ] },
      { id: "add", label: "Adicionais", type: "multi", min: 0, max: 4, choices: [
        { id: "pacoca", name: "Paçoca", price: 3.00 }, { id: "mm", name: "M&M", price: 5.00 }, { id: "ninho", name: "Ninho", price: 3.00 }, { id: "banana", name: "Banana", price: 3.00 } ] } ] },
  { id: "a-garrafa", cat: "Açaí", name: "Açaí na Garrafa 500ml", desc: "Com leite condensado e leite Ninho.", price: 19.99, img: "img/acai-garrafa.jpg" },
  { id: "b-coca-lata", cat: "Bebidas", name: "Coca-Cola Lata 350ml", desc: "Gelada", price: 6.00, img: "img/b-coca-lata.jpg" },
  { id: "b-coca-600", cat: "Bebidas", name: "Coca-Cola 600ml", desc: "Gelada", price: 10.00, img: "img/b-coca-600.jpg" },
  { id: "b-coca-2l", cat: "Bebidas", name: "Coca-Cola 2L", desc: "Gelada", price: 16.00, img: "img/b-coca-2l.jpg" },
];
var DEFAULT_PRODUCTS = JSON.parse(JSON.stringify(PRODUCTS));
var CATS_ORDER = ["Pastéis", "Açaí", "Bebidas"];
/* Cardápio salvo no painel: { overrides: { id: {name,cat,price,desc,img,ativo,choices:{grupo:{opção:preço}}} }, custom: [produtos novos] }.
   Recria PRODUCTS (no lugar, mesma array) a partir dos padrões + alterações. Usado no servidor (preço do pedido) e no painel. */
function applyMenu(menu, pastelAdds) {
  menu = menu || {}; var ov = menu.overrides || {};
  var list = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)).concat(JSON.parse(JSON.stringify(menu.custom || [])));
  PRODUCTS.length = 0; list.forEach(function (p) { PRODUCTS.push(p); });
  applyAddPrices(pastelAdds);
  PRODUCTS.forEach(function (p) { var o = ov[p.id]; if (!o) return;
    ['name', 'cat', 'desc', 'img'].forEach(function (k) { if (typeof o[k] === 'string' && (o[k] || k === 'desc')) p[k] = o[k]; });
    if (typeof o.price === 'number' && o.price >= 0) p.price = o.price; if (typeof o.ativo === 'boolean') p.ativo = o.ativo;
    var ch = o.choices || {}; (p.options || []).forEach(function (g) { if (g.padds || !ch[g.id]) return; g.choices.forEach(function (c) { var v = ch[g.id][c.id]; if (typeof v === 'number' && v >= 0) c.price = v; }); });
  });
  return PRODUCTS;
}
/* Loja: troca o cardápio pelo que veio da API (/api/menu). */
function setProducts(list) { if (!Array.isArray(list) || !list.length) return; PRODUCTS.length = 0; list.forEach(function (p) { PRODUCTS.push(p); }); }
/* Valida opções e calcula preço unitário + descrição ("300ml + Paçoca, Ninho"). Usado no site e no servidor. */
function priceItem(p, opts, nota) {
  opts = opts || {}; nota = String(nota == null ? '' : nota).replace(/\s+/g, ' ').trim();
  if (nota && !p.nota) throw new Error('Observação não permitida em ' + p.name); if (nota.length > 100) throw new Error('Observação muito longa (máx. 100)'); var unit = p.price, parts = [], norm = {};
  Object.keys(opts).forEach(function (g) { if (!(p.options || []).some(function (x) { return x.id === g; })) throw new Error('Opção inválida em ' + p.name); });
  (p.options || []).forEach(function (g) {
    var sel = opts[g.id] || []; if (!Array.isArray(sel)) throw new Error('Opção inválida em ' + p.name);
    sel = sel.filter(function (v, i) { return sel.indexOf(v) === i; });
    if (sel.length < g.min) throw new Error('Escolha ' + g.label.toLowerCase() + ' para ' + p.name);
    if (sel.length > g.max) throw new Error('Máximo de ' + g.max + ' em ' + g.label.toLowerCase());
    var names = sel.map(function (cid) { var c = g.choices.find(function (x) { return x.id === cid; }); if (!c) throw new Error('Opção inválida em ' + p.name); unit += c.price; return c.name; });
    norm[g.id] = g.choices.filter(function (c) { return sel.indexOf(c.id) >= 0; }).map(function (c) { return c.id; });
    names = g.choices.filter(function (c) { return sel.indexOf(c.id) >= 0; }).map(function (c) { return c.name; });
    if (names.length) parts.push(g.type === 'single' ? names.join('') : g.id === 'sem' ? names.map(function (n) { return n.toUpperCase(); }).join(', ') : (g.id === 'add' ? '+ ' : '') + names.join(', '));
  });
  if (nota) parts.push('Obs: ' + nota);
  return { unit: Math.round(unit * 100) / 100, detalhe: parts.join(' · '), opts: norm, nota: nota };
}

/* Taxa de entrega: número (ex.: 5.00) = valor fixo; null = "a combinar". Retirada é sempre R$ 0,00.
   (Pronto para um futuro cálculo por bairro/distância: troque deliveryFee() abaixo.) */
var DELIVERY_FEE = null;
function deliveryFee(tipo) { return tipo === 'Retirada' ? 0 : DELIVERY_FEE; }
var ORDER_STATUSES = ['Recebido', 'Aceito', 'Em produção', 'Pronto', 'Saiu para entrega', 'Pronto para retirada', 'Entregue', 'Cancelado'];
function brlFmt(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
/* Monta itens + subtotal + taxa + total (mesma regra no site e no servidor). */
function buildBreakdown(cartPairs, tipo, fee) {
  var itens = [], subtotal = 0;
  cartPairs.forEach(function (c) {
    var p = PRODUCTS.find(function (x) { return x.id === c.id; }); var q = Math.floor(Number(c.qty));
    if (!p || !(q >= 1 && q <= 99)) throw new Error('Item inválido: ' + c.id);
    if (p.ativo === false) throw new Error(p.name + ' está indisponível no momento');
    var pr = priceItem(p, c.opts, c.nota);
    var s = Math.round(pr.unit * q * 100) / 100; subtotal += s;
    itens.push({ id: p.id, name: p.name, detalhe: pr.detalhe, opts: pr.opts, nota: pr.nota || undefined, qty: q, unit: pr.unit, subtotal: s });
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
if (typeof module !== 'undefined') module.exports = { PRODUCTS, DEFAULT_PRODUCTS, CATS_ORDER, applyMenu, setProducts, PASTEL_ADDS, applyAddPrices, priceItem, DELIVERY_FEE, deliveryFee, ORDER_STATUSES, buildBreakdown, orderText, brlFmt, feeLabel };
