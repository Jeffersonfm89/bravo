/* Painel Bravo: quadro (kanban) de pedidos. Substitui render() do admin.html. */
(function () {
  var q = function (s) { return document.querySelector(s); };
  var COLS = [
    { id: "novo", t: "Pedidos", st: ["Recebido"] },
    { id: "prep", t: "Em preparo", st: ["Aceito", "Em produção"] },
    { id: "pronto", t: "Prontos", st: ["Pronto", "Pronto para retirada"] },
    { id: "saiu", t: "Saiu para entrega", st: ["Saiu para entrega"] },
    { id: "fim", t: "Finalizados", st: ["Entregue", "Cancelado"] } ];
  var nudge = {};
  var PAGS = ["Pix", "Dinheiro", "Máquina de cartão"];
  function spDay(d) { return new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 10); }
  var day = spDay(Date.now());
  var css = document.createElement("style");
  css.textContent = "#filters,#list{display:none!important}.kb{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:10px}" +
    ".kc{flex:0 0 88%;max-width:360px;scroll-snap-align:start;background:#121212;border:1px solid #262626;border-radius:14px;padding:8px;display:flex;flex-direction:column;gap:8px;min-height:60vh}" +
    "@media(min-width:1000px){.kc{flex:1 1 0;max-width:none}.wrap{max-width:none!important}}" +
    ".kc h3{margin:2px 4px;display:flex;justify-content:space-between;font-size:16px}.kc h3 span{background:#f5b400;color:#000;border-radius:12px;padding:0 9px}" +
    ".kd{background:#1b1b1b;border:1px solid #2c2c2c;border-radius:12px;padding:10px;font-size:14px}.kd.novo{border:2px solid #f5b400}.kd .top{display:flex;justify-content:space-between;font-weight:800}" +
    ".kd ul{margin:6px 0;padding-left:18px}.kd li small{color:#f5b400}.kb .big{width:100%;border:0;border-radius:12px;padding:16px;font-size:17px;font-weight:900;margin-top:6px}" +
    ".b-ok{background:#25d366;color:#000}.b-no{background:#3a1414;color:#ff8a80}.b-go{background:#f5b400;color:#000}.krow{display:flex;gap:6px;margin-top:6px}.krow>*{flex:1;text-align:center;padding:10px!important;margin:0!important;font-size:13px}" +
    ".wa.nudge{animation:pulse2 1s infinite;outline:3px solid #25d366}@keyframes pulse2{50%{opacity:.6}}" +
    ".pgsum{background:#0e0e0e;border-radius:10px;padding:8px}.pgsum div{display:flex;justify-content:space-between;padding:3px 0}.kd.canc{opacity:.55}" +
    "#waitBox{background:#121212;border:1px dashed #555;border-radius:12px;padding:8px 10px;margin-bottom:10px}#waitBox summary{cursor:pointer;font-weight:800}.wgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin-top:8px}" +
    "#finModal{position:fixed;inset:0;z-index:40;background:#000c;display:flex;align-items:center;justify-content:center}#finModal[hidden]{display:none}" +
    "#finModal .box{background:#141414;border-radius:16px;padding:16px;width:min(380px,92%);display:flex;flex-direction:column;gap:10px}#finModal label{display:flex;gap:10px;align-items:center;font-size:18px;padding:10px;border:1px solid #333;border-radius:12px}#finModal input{width:22px;height:22px;accent-color:#f5b400}";
  document.head.appendChild(css);
  var bcss = document.createElement("style"); bcss.textContent = ".kd.blink{animation:kblink 1s ease-in-out infinite}@keyframes kblink{0%,100%{border-color:#f5b400;box-shadow:0 0 0 0 #f5b400aa;background:#1a1a1a}50%{border-color:#ff5252;box-shadow:0 0 14px 4px #f5b40088;background:#3a2a00}}@media(prefers-reduced-motion:reduce){.kd.blink{animation:none;border-color:#ff5252;background:#3a2a00}}"; document.head.appendChild(bcss);
  var kb = document.createElement("div"); kb.className = "kb"; kb.id = "kanban"; q("#list").after(kb);
  var fm = document.createElement("div"); fm.id = "finModal"; fm.hidden = true;
  fm.innerHTML = '<div class="box"><h3 style="margin:0">Finalizar pedido <span id="fmId"></span></h3><p class="cust" id="fmInfo"></p><div id="fmOpts"></div><button class="big b-ok" id="fmOk" style="border:0;border-radius:12px;padding:16px;font-size:17px;font-weight:900">Confirmar entrega</button><button class="ghost" id="fmCancel">Voltar</button></div>';
  document.body.appendChild(fm);
  function isReady(o) { return !/^Pix/.test(o.pagamento) || o.pago || o.liberadoManual; }
  function badge(o) { if (/^Pix/.test(o.pagamento)) return o.pago ? '<b class="paid">PIX PAGO</b>' : o.liberadoManual ? '<b class="pend">PIX LIBERADO MANUALMENTE</b>' : '<b class="pend">AGUARDANDO PIX</b>';
    return '<b class="pend">PAGAR NA ENTREGA - ' + esc(o.pagamento === "Cartão" ? "CARTÃO" : "DINHEIRO") + "</b>"; }
  function defPag(o) { if (o.pagamentoFinal) return o.pagamentoFinal; if (/^Pix/.test(o.pagamento)) return "Pix"; if (o.pagamento === "Cartão") return "Máquina de cartão"; return "Dinheiro"; }
  function items(o) { return "<ul>" + o.itens.map(function (i) { return "<li>" + i.qty + "x " + esc(i.name) + (i.detalhe ? "<br><small>" + esc(i.detalhe) + "</small>" : "") + "</li>"; }).join("") + "</ul>"; }
  function card(o, col) {
    var c = o.cliente, ent = c.tipo !== "Retirada", hr = new Date(o.criadoEm).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
    var pg = badge(o);
    var h = '<div class="kd ' + col + (col === "novo" && o.status === "Recebido" ? " blink" : "") + (o.status === "Cancelado" ? " canc" : "") + '"><div class="top"><span>nº ' + esc(o.id.slice(-8)) + " · " + hr + '</span><span class="st">' + brlFmt(o.total) + "</span></div>" +
      "<div><b>" + esc(c.nome) + "</b> · " + (ent ? "🛵 " + esc(c.bairro || "Entrega") : "🏪 Retirada") + " · " + pg + "</div>" + items(o) + (c.obs ? "<div><b>Obs:</b> " + esc(c.obs) + "</div>" : "");
    if (col === "wait") h += '<button class="big b-go" data-lib="' + o.id + '">Liberar manualmente</button><button class="big b-no" data-k="Cancelado" data-id="' + o.id + '">Cancelar</button>';
    if (col === "novo") h += '<button class="big b-ok" data-k="Aceito" data-id="' + o.id + '">ACEITAR</button><button class="big b-no" data-k="Cancelado" data-id="' + o.id + '">Recusar / Cancelar</button>';
    if (col === "prep") h += '<button class="big b-go" data-k="' + (ent ? "Pronto" : "Pronto para retirada") + '" data-id="' + o.id + '">PRONTO</button>';
    if (col === "pronto") h += ent ? '<button class="big b-go" data-k="Saiu para entrega" data-id="' + o.id + '">SAIU PARA ENTREGA</button>' : '<button class="big b-ok" data-fin="' + o.id + '">RETIRADO / ENTREGUE</button>';
    if (col === "saiu") h += '<button class="big b-ok" data-fin="' + o.id + '">ENTREGUE</button>';
    if (col === "fim") h += "<div>" + (o.status === "Cancelado" ? "❌ Cancelado" : "💰 " + esc(o.pagamentoFinal || defPag(o))) + "</div>";
    h += '<div class="krow"><button class="ghost" data-print="' + o.id + '">🖨️ Imprimir</button><a class="wa' + (nudge[o.id] === o.status ? " nudge" : "") + '" target="_blank" href="' + waLink(o) + '" data-wa="' + o.id + '">📲 ' + (nudge[o.id] === o.status ? "Avisar: " + esc(o.status) : "WhatsApp") + '</a></div></div>';
    return h;
  }
  window.render = function () {
    var by = {}; COLS.forEach(function (c) { by[c.id] = []; });
    var wait = orders.filter(function (o) { return o.status === "Recebido" && !isReady(o); });
    orders.forEach(function (o) { if (o.status === "Recebido" && !isReady(o)) return; var col = COLS.find(function (c) { return c.st.indexOf(o.status) >= 0; }); if (!col) return; if (col.id === "fim" && spDay(o.atualizadoEm || o.criadoEm) !== day) return; by[col.id].push(o); });
    kb.innerHTML = COLS.map(function (c) {
      var list = by[c.id].slice().sort(function (a, b) { return c.id === "fim" ? b.criadoEm.localeCompare(a.criadoEm) : a.criadoEm.localeCompare(b.criadoEm); }), extra = "";
      if (c.id === "fim") {
        var g = {}, tot = 0, n = 0; list.filter(function (o) { return o.status === "Entregue"; }).forEach(function (o) { var k = o.pagamentoFinal || defPag(o); g[k] = g[k] || { n: 0, v: 0 }; g[k].n++; g[k].v += o.total; tot += o.total; n++; });
        extra = '<input type="date" id="finDay" value="' + day + '"><div class="pgsum">' + Object.keys(g).map(function (k) { return "<div><span>" + esc(k) + " (" + g[k].n + ")</span><b>" + brlFmt(g[k].v) + "</b></div>"; }).join("") +
          '<div style="border-top:1px solid #333;margin-top:4px"><span><b>Total (' + n + ")</b></span><b class='st'>" + brlFmt(tot) + "</b></div></div>";
      }
      return '<div class="kc"><h3>' + c.t + " <span>" + list.length + "</span></h3>" + extra + (list.map(function (o) { return card(o, c.id); }).join("") || '<p class="cust" style="text-align:center">—</p>') + "</div>";
    }).join("");
    kb.insertAdjacentHTML("afterbegin", "");
    var wb = q("#waitBox"); if (!wb) { wb = document.createElement("details"); wb.id = "waitBox"; kb.before(wb); }
    var openNow = wb.open; wb.innerHTML = "<summary>⏳ Aguardando Pix <span class='cbadge'>" + wait.length + "</span> <small class='est'>(não aparecem em Novos até o pagamento ser confirmado)</small></summary><div class='wgrid'>" + (wait.map(function (o) { return card(o, "wait"); }).join("") || "<p class='cust'>Nenhum.</p>") + "</div>"; wb.open = openNow;
    var fd = q("#finDay"); if (fd) fd.onchange = function () { day = this.value || spDay(Date.now()); render(); };
  };
  function upd(o) { orders = orders.map(function (x) { return x.id === o.id ? o : x; }); render(); }
  document.addEventListener("click", function (e) {
    var l = e.target.closest && e.target.closest("[data-lib]"); if (!l) return;
    if (!confirm("Liberar este pedido sem confirmação do Pix? Só faça isso se você conferiu o pagamento.")) return; l.disabled = true;
    call({ action: "liberar", id: l.dataset.lib }).then(upd).catch(function (er) { alert(er.message); l.disabled = false; });
  });
  q("#tPedidos").addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#waitBox [data-k]")) kbClick(e); });
  kb.addEventListener("click", kbClick);
  function kbClick(e) {
    var b = e.target.closest("[data-k]"), f = e.target.closest("[data-fin]");
    if (b) { if (b.dataset.k === "Cancelado" && !confirm("Recusar/cancelar este pedido?")) return; b.disabled = true;
      var acc = b.dataset.k === "Aceito", w = acc ? window.open("", "_blank") : null;   // abre já no toque (evita bloqueio de pop-up)
      call({ action: "setStatus", id: b.dataset.id, status: b.dataset.k }).then(function (o) {
        if (acc) { var txt = "Olá, " + o.cliente.nome + "! Aqui é da Bravo 👑\nSeu pedido foi *ACEITO* ✅ Confira os dados abaixo e responda *OK* para confirmar, por favor:\n\n" + orderText(o, SITE_URL + "pedido.html?id=" + o.id);
          var url = "https://wa.me/" + phone(o.cliente.tel) + "?text=" + encodeURIComponent(txt); if (w) w.location.href = url; else window.open(url, "_blank"); }
        else nudge[o.id] = o.status;   // destaca o botão "Avisar" no cartão
        upd(o); if (acc && window.bravoOnAccepted) window.bravoOnAccepted(o); }).catch(function (er) { if (w) w.close(); alert(er.message); b.disabled = false; }); }
    if (f) openFin(orders.find(function (o) { return o.id === f.dataset.fin; }));
  }
  var finO = null;
  function openFin(o) { finO = o; var paid = /^Pix/.test(o.pagamento) && o.pago, d = defPag(o);
    q("#fmId").textContent = "nº " + o.id.slice(-8); q("#fmInfo").textContent = o.cliente.nome + " · " + brlFmt(o.total) + " · pedido: " + o.pagamento + (paid ? " (PAGO)" : "") + ". Como foi pago?";
    q("#fmOpts").innerHTML = PAGS.map(function (p) { return '<label><input type="radio" name="fmPag" value="' + p + '"' + (p === d ? " checked" : "") + (paid && p !== "Pix" ? " disabled" : "") + "> " + p + "</label>"; }).join("");
    fm.hidden = false; }
  q("#fmCancel").onclick = function () { fm.hidden = true; };
  q("#fmOk").onclick = function () { var r = document.querySelector("[name=fmPag]:checked"); if (!r || !finO) return; var btn = this; btn.disabled = true;
    call({ action: "setStatus", id: finO.id, status: "Entregue", pagamentoFinal: r.value }).then(function (o) { fm.hidden = true; nudge[o.id] = o.status; upd(o); }).catch(function (er) { alert(er.message); }).then(function () { btn.disabled = false; }); };
  if (window.getOrders && getOrders().length) render();
})();
