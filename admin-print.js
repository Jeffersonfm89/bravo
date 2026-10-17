/* Painel Bravo: comanda na impressora térmica 58mm (ESC/POS) via servidor local no PC da loja
   (C:\BravoImpressora, http://localhost:17788). Imprime sozinho quando o pedido é ACEITO e pelo botão 🖨️. */
(function () {
  var HELPER = "http://localhost:17788", W = 32, LS = localStorage;
  var KEY_ON = "bravo_autoPrintAceito", KEY_DONE = "bravo_printedAceito", WINDOW_MS = 20 * 60e3;
  var q = function (s) { return document.querySelector(s); };
  var MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (MOBILE) {   // celular não tem impressora térmica ligada: botão 🖨️ usa a impressão do navegador, sem impressão automática
    var o0 = q("#optAutoPrint"); if (o0) o0.closest("label").remove();
    window.bravoPrintManual = function (o) { if (window.printOrders) window.printOrders([o]); };
    return;
  }
  var ESC = "\x1b", GS = "\x1d";
  var INIT = ESC + "@", CENTER = ESC + "a\x01", LEFT = ESC + "a\x00", BIG = ESC + "!\x30", DH = ESC + "!\x10", BOLD = ESC + "!\x08", NORM = ESC + "!\x00", CUT = GS + "V\x42\x00";
  // ---------- texto para a impressora (só ASCII: tira acentos e emojis)
  function asc(s) {
    s = String(s == null ? "" : s).replace(/[º°]/g, "o").replace(/ª/g, "a").replace(/[–—]/g, "-").replace(/[·•]/g, "-").replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/\u00a0/g, " ");
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return s.replace(/[^\x20-\x7e\n]/g, "").replace(/[ \t]+/g, " ").trim();
  }
  function wrap(s, w, ind) {
    ind = ind || ""; var out = [], line = "";
    asc(s).split(" ").forEach(function (word) {
      while (word.length > w - ind.length) { if (line) { out.push(line); line = ""; } out.push(ind + word.slice(0, w - ind.length)); word = word.slice(w - ind.length); }
      if (!word) return;
      if (!line) line = ind + word; else if ((line + " " + word).length <= w) line += " " + word; else { out.push(line); line = ind + word; }
    });
    if (line) out.push(line);
    return out;
  }
  function money(v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ","); }
  function lr(l, r, w) { w = w || W; l = asc(l); r = asc(r); var room = w - r.length - 1;
    if (l.length <= room) return l + new Array(w - l.length - r.length + 1).join(" ") + r;
    var ls = wrap(l, room); var last = ls.pop(); return ls.concat([last + new Array(w - last.length - r.length + 1).join(" ") + r]).join("\n"); }
  var HR = new Array(W + 1).join("-");
  function first(n) { return asc(n).split(" ")[0] || "cliente"; }
  function pagLines(o) {
    var c = o.cliente || {}, ret = c.tipo === "Retirada", p = o.pagamento || "", quando = ret ? "na retirada" : "na entrega";
    if (/^Pix/.test(p)) { if (o.pago) return ["PIX PAGO"]; if (o.liberadoManual) return ["PIX (liberado manualmente)"]; if (/combinar/i.test(p)) return ["PIX - combinar com a loja"]; return ["PIX PENDENTE"]; }
    if (p === "Cartão") return ["CARTAO - cobrar " + quando, "(levar maquininha)"];
    if (/Dinheiro/i.test(p)) return ["DINHEIRO - cobrar " + quando];
    return [asc(p)];
  }
  function ticket(o) {
    var c = o.cliente || {}, ret = c.tipo === "Retirada", t = "";
    var dt = new Date(o.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
    var L = function (s) { t += s + "\n"; };
    t += INIT + CENTER + BIG; L("BRAVO"); t += NORM; L("Saborear cada momento."); L(HR);
    t += DH; wrap("Obrigado, " + first(c.nome) + "!", W).forEach(L); t += NORM; L(HR);
    t += DH; wrap("PEDIDO " + o.id, W).forEach(L); t += NORM; L(dt);
    t += DH; L(ret ? "RETIRADA NO LOCAL" : "ENTREGA"); t += NORM + LEFT; L(HR);
    wrap("Cliente: " + c.nome, W).forEach(L); L("Tel: " + asc(c.tel));
    if (!ret) {
      if (c.rua) { wrap("End: " + c.rua + ", " + c.numero + (c.complemento ? " - " + c.complemento : ""), W).forEach(L); t += BOLD; wrap("Bairro: " + c.bairro, W).forEach(L); t += NORM; if (c.referencia) wrap("Ref: " + c.referencia, W).forEach(L); }
      else if (c.end) wrap("End: " + c.end, W).forEach(L);
    }
    L(HR);
    (o.itens || []).forEach(function (i) {
      t += BOLD; L(lr(i.qty + "x " + i.name, money(i.subtotal))); t += NORM;
      String(i.detalhe || "").split(" · ").filter(Boolean).forEach(function (part) { wrap(part, W, "  ").forEach(L); });
      if (i.qty > 1) L("  (" + money(i.unit) + " cada)");
    });
    L(HR);
    L(lr("Subtotal", money(o.subtotal)));
    if (!ret) L(lr("Taxa de entrega", o.taxaEntrega == null ? "a combinar" : money(o.taxaEntrega)));
    t += DH; L(lr("TOTAL", money(o.total) + (o.taxaEntrega == null && !ret ? "+ent." : ""))); t += NORM;
    t += BOLD; pagLines(o).forEach(function (s) { wrap("Pagamento: " + s, W).forEach(L); }); t += NORM;
    if (c.obs) { L(HR); t += BOLD; wrap("OBS/TROCO: " + c.obs, W).forEach(L); t += NORM; }
    L(HR); t += CENTER; L("WhatsApp (47) 99697-7883"); L("bravojoinville.com.br"); t += LEFT;
    t += "\n\n\n\n" + CUT;
    return t;
  }
  function b64(str) { var s = ""; for (var k = 0; k < str.length; k++) s += String.fromCharCode(str.charCodeAt(k) & 0xff); return btoa(s); }
  window.bravoTicketBytes = function (o) { return b64(ticket(o)); };   // usado no teste
  // ---------- conversa com o servidor local
  function req(path, body, ms) {
    var ac = window.AbortController ? new AbortController() : null, tm = ac && setTimeout(function () { ac.abort(); }, ms || 4000);
    var opt = body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { method: "GET" };
    if (ac) opt.signal = ac.signal;
    return fetch(HELPER + path, opt).then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.ok) throw new Error(d.erro || "falhou"); return d; }); })
      .finally(function () { if (tm) clearTimeout(tm); });
  }
  function sendOrder(o) { return req("/print", { id: o.id, data: b64(ticket(o)) }, 8000); }
  // ---------- aviso discreto
  var toast = document.createElement("div"); toast.id = "prToast";
  toast.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:60;background:#2a1a00;color:#ffd27a;border:1px solid #f5b400;border-radius:12px;padding:10px 14px;font-size:14px;font-weight:700;max-width:92%;display:none";
  document.body.appendChild(toast); var tTimer = null;
  function notice(msg, ok) { toast.textContent = msg; toast.style.background = ok ? "#0f2a17" : "#2a1a00"; toast.style.color = ok ? "#9ff0b8" : "#ffd27a"; toast.style.borderColor = ok ? "#25d366" : "#f5b400"; toast.style.display = "block"; clearTimeout(tTimer); tTimer = setTimeout(function () { toast.style.display = "none"; }, 6000); }
  var lastWarn = 0;
  function offline(manual) { setStatus(false); if (manual || Date.now() - lastWarn > 5 * 60e3) { lastWarn = Date.now(); notice("🖨️ Impressora não conectada" + (manual ? " — abrindo impressão do navegador" : "")); } }
  // ---------- controles na barra de pedidos
  var bar = q("#alertBar"), old = q("#optAutoPrint"); if (old) old.closest("label").remove();
  var box = document.createElement("span"); box.style.cssText = "display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap";
  box.innerHTML = '<label><input type="checkbox" id="optThermal"> 🖨️ Imprimir comanda ao aceitar</label><small id="prState" class="est">Impressora: verificando…</small><button id="prTest" class="ghost" style="padding:6px 10px">Testar impressora</button>';
  if (bar) bar.insertBefore(box, q("#optPaper") ? q("#optPaper").closest("label") : null);
  var chk = q("#optThermal"); chk.checked = LS.getItem(KEY_ON) !== "0";
  chk.onchange = function () { LS.setItem(KEY_ON, chk.checked ? "1" : "0"); };
  function setStatus(on) { window.bravoPrinterOnline = !!on; var s = q("#prState"); if (s) { s.textContent = "Impressora: " + (on ? "conectada ✅" : "não conectada"); s.style.color = on ? "#25d366" : ""; } }
  function check() { return req("/status", null, 2500).then(function () { setStatus(true); return true; }, function () { setStatus(false); return false; }); }
  q("#prTest").onclick = function () { req("/print", { id: "teste", text: "BRAVO - teste de impressora\n" + new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) + "\nSe saiu este papel, esta tudo certo!" }, 8000)
    .then(function () { setStatus(true); notice("🖨️ Teste enviado para a impressora", true); }, function () { offline(true); }); };
  // ---------- controle de "já impresso" (não imprime 2x o mesmo pedido)
  function done() { try { return JSON.parse(LS.getItem(KEY_DONE) || "[]"); } catch (e) { return []; } }
  function isDone(id) { return done().indexOf(id) >= 0; }
  function mark(id, on) { var d = done().filter(function (x) { return x !== id; }); if (on) d.push(id); LS.setItem(KEY_DONE, JSON.stringify(d.slice(-500))); }
  var busy = {}, failAt = {};
  function autoPrint(o) {
    if (!chk.checked || !o || busy[o.id] || isDone(o.id)) return;
    if (failAt[o.id] && Date.now() - failAt[o.id] < 30e3) return;   // tenta de novo a cada 30s se a impressora estava fora
    busy[o.id] = 1; mark(o.id, true);   // reserva antes de enviar (evita duplicar entre abas)
    sendOrder(o).then(function () { setStatus(true); delete failAt[o.id]; notice("🖨️ Comanda impressa: " + first(o.cliente.nome), true); },
      function () { mark(o.id, false); failAt[o.id] = Date.now(); offline(false); })
      .then(function () { delete busy[o.id]; });
  }
  function acceptedAt(o) { var h = (o.historico || []).filter(function (x) { return x.status === "Aceito"; }).pop(); return h ? new Date(h.em).getTime() : 0; }
  // aceitou neste aparelho: imprime na hora
  window.bravoOnAccepted = function (o) { autoPrint(o); };
  // aceitou em outro aparelho (ex.: celular): o PC com o painel aberto imprime na próxima atualização (em até ~30s; pedidos aceitos há até 20 min)
  window.bravoCheckAccepted = function (orders) {
    (orders || []).forEach(function (o) { if (["Aceito", "Em produção"].indexOf(o.status) < 0) return; var a = acceptedAt(o); if (a && Date.now() - a < WINDOW_MS) autoPrint(o); });
  };
  // botão 🖨️ do cartão: sempre imprime (reimpressão); se a térmica não estiver ligada, usa a impressão do navegador
  window.bravoPrintManual = function (o) {
    sendOrder(o).then(function () { setStatus(true); notice("🖨️ Comanda enviada para a impressora", true); }, function () { offline(true); if (window.printOrders) window.printOrders([o]); });
  };
  var prevOnOrders = window.onOrders; window.onOrders = function (os) { if (prevOnOrders) prevOnOrders(os); window.bravoCheckAccepted(os); };
  if (window.getOrders && getOrders().length) window.bravoCheckAccepted(getOrders());
  check(); setInterval(check, 60e3);
})();
