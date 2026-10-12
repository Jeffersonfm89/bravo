/* Painel Bravo: alertas de novos pedidos + impressão de comanda. */
(function () {
  var LS = localStorage, seen = null, alarmTimer = null, actx = null, wakeLock = null, pendingNew = [];
  var q = function (s) { return document.querySelector(s); };
  function info(t) { q("#alertInfo").textContent = t; }
  // ---------- preferências
  ["optWake", "optAutoPrint"].forEach(function (id) { q("#" + id).checked = LS.getItem("bravo_" + id) === "1"; q("#" + id).onchange = function () { LS.setItem("bravo_" + id, this.checked ? "1" : "0"); if (id === "optWake") wake(this.checked); }; });
  q("#optPaper").value = LS.getItem("bravo_paper") || "80"; q("#optPaper").onchange = function () { LS.setItem("bravo_paper", this.value); };
  // ---------- som (Web Audio: precisa de um toque do usuário para liberar no celular)
  function unlockAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) {} }
  function beep() {
    if (!actx) return; var t = actx.currentTime;
    [0, 0.25, 0.5].forEach(function (d, i) { var o = actx.createOscillator(), g = actx.createGain(); o.type = "square"; o.frequency.value = i % 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.9, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
      o.connect(g); g.connect(actx.destination); o.start(t + d); o.stop(t + d + 0.22); });
    if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 400]);
  }
  function startAlarm(text) { q("#nbText").textContent = text; q("#newBanner").hidden = false; if (!alarmTimer) { beep(); alarmTimer = setInterval(beep, 1500); } }
  function stopAlarm() { clearInterval(alarmTimer); alarmTimer = null; q("#newBanner").hidden = true; if (navigator.vibrate) navigator.vibrate(0); pendingNew = []; }
  q("#nbAck").onclick = stopAlarm;
  q("#btnTestAlert").onclick = function () { unlockAudio(); startAlarm("TESTE DE ALERTA"); };
  // ---------- notificações + service worker
  var swReg = null;
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js?v=20261012113101").then(function (r) { swReg = r; }).catch(function () {});
  function notify(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    var opt = { body: body, icon: "img/logo.jpg", badge: "img/logo.jpg", tag: "bravo-pedido", renotify: true, requireInteraction: true, vibrate: [400, 150, 400] };
    try { if (swReg) swReg.showNotification(title, opt); else new Notification(title, opt); } catch (e) {}
  }
  q("#btnAlerts").onclick = function () {
    unlockAudio(); beep();
    if ("Notification" in window) Notification.requestPermission().then(function (p) { refreshInfo(p); }); else refreshInfo("unsupported");
    if (q("#optWake").checked) wake(true);
  };
  function refreshInfo(p) {
    p = p || ("Notification" in window ? Notification.permission : "unsupported");
    info("Alertas sonoros " + (actx && actx.state === "running" ? "ativos" : "inativos (toque em Ativar)") + " · Notificações: " + ({ granted: "permitidas", denied: "bloqueadas no navegador", default: "não autorizadas", unsupported: "não suportadas" }[p] || p));
    if (actx && actx.state === "running") q("#btnAlerts").textContent = "🔔 Alertas ativos";
  }
  // ---------- tela ligada
  function wake(on) {
    if (!("wakeLock" in navigator)) { if (on) info("Este navegador não suporta manter a tela ligada"); return; }
    if (on && !wakeLock) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; w.addEventListener("release", function () { wakeLock = null; }); }).catch(function () {});
    if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && q("#optWake").checked) wake(true); });
  // ---------- detecção de novos pedidos (chamado após cada atualização da lista)
  window.onOrders = function (orders) {
    var ids = orders.map(function (o) { return o.id; });
    // só pedidos "liberados" contam: Pix pago, liberado manualmente, ou dinheiro/cartão
    var ready = orders.filter(function (o) { return o.status !== "Cancelado" && (!/^Pix/.test(o.pagamento) || o.pago || o.liberadoManual); });
    ids = ready.map(function (o) { return o.id; });
    if (seen === null) { seen = new Set(JSON.parse(LS.getItem("bravo_seen") || "null") || ids); }
    var fresh = ready.filter(function (o) { return !seen.has(o.id); });
    ids.forEach(function (id) { seen.add(id); }); LS.setItem("bravo_seen", JSON.stringify(Array.from(seen).slice(-500)));
    if (!fresh.length) return;
    pendingNew = pendingNew.concat(fresh);
    var o = fresh[0], txt = (fresh.length > 1 ? fresh.length + " NOVOS PEDIDOS!" : "NOVO PEDIDO nº " + o.id) ;
    startAlarm(txt + "\n" + o.cliente.nome + " · " + brlFmt(o.total));
    notify("🔔 " + txt, o.cliente.nome + " · " + brlFmt(o.total) + " · " + o.pagamento);
    if (q("#optAutoPrint").checked) printOrders(fresh);
  };
  window.onStart = function () { unlockAudio(); refreshInfo(); if (q("#optWake").checked) wake(true); };
  // ---------- comanda
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ticket(o) {
    var c = o.cliente, dt = new Date(o.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    var pagoTxt = o.pagamento.indexOf("Pix") === 0 ? (o.pago ? "PAGO (Pix)" : "PENDENTE (Pix)") : "PENDENTE - " + o.pagamento;
    var h = '<div class="tk"><h1>BRAVO</h1><div class="c">Saborear cada momento.</div><hr>';
    h += '<div class="big">PEDIDO Nº ' + e(o.id) + "</div><div>" + e(dt) + " (Brasília)</div><hr>";
    h += "<div><b>Cliente:</b> " + e(c.nome) + "</div><div><b>Tel:</b> " + e(c.tel) + "</div>";
    if (c.tipo === "Retirada") h += '<div class="big">RETIRADA NO LOCAL</div>';
    else { h += '<div class="big">ENTREGA</div>';
      if (c.rua) h += "<div>" + e(c.rua) + ", " + e(c.numero) + (c.complemento ? " - " + e(c.complemento) : "") + "</div><div><b>Bairro:</b> " + e(c.bairro) + "</div>" + (c.referencia ? "<div><b>Ref.:</b> " + e(c.referencia) + "</div>" : "");
      else h += "<div>" + e(c.end) + "</div>"; }
    h += "<hr><table>";
    o.itens.forEach(function (i) { h += "<tr><td><b>" + i.qty + "x " + e(i.name) + "</b>" + (i.detalhe ? '<div class="det">' + e(i.detalhe).replace(/(SEM [^,+·]+)/g, '<b style="font-size:13px">$1</b>') + "</div>" : "") + '<div class="det">' + brlFmt(i.unit) + ' cada</div></td><td class="r">' + brlFmt(i.subtotal) + "</td></tr>"; });
    h += "</table><hr><table><tr><td>Subtotal</td><td class='r'>" + brlFmt(o.subtotal) + "</td></tr><tr><td>Taxa de entrega</td><td class='r'>" + feeLabel(o.taxaEntrega) + "</td></tr>";
    h += "<tr class='big'><td><b>TOTAL</b></td><td class='r'><b>" + brlFmt(o.total) + (o.taxaEntrega == null ? " + entrega" : "") + "</b></td></tr></table>";
    h += "<div><b>Pagamento:</b> " + e(o.pagamento) + '</div><div class="st">' + e(pagoTxt) + "</div>";
    if (c.obs) h += "<div><b>Obs./troco:</b> " + e(c.obs) + "</div>";
    return h + '<hr><div class="c">Obrigado pela preferência!</div></div>';
  }
  function printOrders(list) {
    var paper = q("#optPaper").value, pa = q("#printArea"), wmm = paper === "58" ? 58 : 80, inner = paper === "58" ? 54 : 76;
    pa.innerHTML = list.map(ticket).join('<div style="break-after:page"></div>');
    q("#pageStyle").textContent = "#printArea{width:" + inner + "mm}" + (paper === "58" ? ".tk{font-size:10.5px}.tk h1{font-size:18px}" : "");
    if (paper === "a4") { q("#pageStyle").textContent += "@page{size:A4;margin:12mm}"; }
    else { // mede a altura real da comanda para gerar uma página contínua do tamanho certo
      pa.style.cssText = "display:block;position:absolute;left:-9999px;top:0;background:#fff";
      var hmm = Math.ceil(pa.scrollHeight * 25.4 / 96) + 8; pa.style.cssText = "";
      q("#pageStyle").textContent += "@page{size:" + wmm + "mm " + Math.max(hmm, 60) + "mm;margin:2mm}";
    }
    setTimeout(function () { window.print(); }, 150);
  }
  window.printOrders = printOrders;
  window.bravoAlert = function (t, body) { startAlarm(t); notify('🔔 ' + t, body || ''); };
  document.addEventListener("pointerdown", unlockAudio, true);           // qualquer toque libera o som
  if (!q("#panel").hidden) window.onStart();
  document.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("[data-print]"); if (!b) return; var o = (window.getOrders ? window.getOrders() : []).find(function (x) { return x.id === b.dataset.print; }); if (o) printOrders([o]); });
})();
