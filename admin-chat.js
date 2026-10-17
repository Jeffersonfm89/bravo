/* Painel Bravo: aba Conversas (chat com clientes). Usa call(), esc(), phone() do admin.html. */
(function () {
  var q = function (s) { return document.querySelector(s); }, cur = null, lastUnread = null, chats = [], started = false;
  function t(d) { return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  function drawList() {
    var un = chats.reduce(function (s, c) { return s + c.unreadAdmin; }, 0);
    q("#chatBadge").hidden = !un; q("#chatBadge").textContent = un;
    q("#chatList").innerHTML = chats.length ? chats.map(function (c) {
      return '<div class="o chi" data-chat="' + c.id + '"><h3><span>' + esc(c.nome) + (c.unreadAdmin ? ' <span class="cbadge">' + c.unreadAdmin + "</span>" : "") + '</span><small class="est">' + t(c.atualizadoEm) + "</small></h3>" +
        '<div class="cust">' + (c.tel ? "📞 " + esc(c.tel) + " · " : "") + (c.orderId ? "Pedido nº " + esc(c.orderId) + " · " : "") + c.n + " msg" + (c.humano ? " · atendimento humano" : "") + (c.fechado ? " · <b>fechada</b>" : "") + "<br>" +
        (c.last ? (c.last.de === "cliente" ? "" : "Você: ") + esc(c.last.txt.slice(0, 80)) : "<i>sem mensagens</i>") + "</div></div>";
    }).join("") : "<p>Nenhuma conversa ainda.</p>";
  }
  var chatSince = null, chatFullAt = 0;
  window.loadChats = function (full) { // incremental: só as conversas que mudaram desde a última vez (lista completa a cada 1h ou ao abrir a aba)
    if (full === true || !chatSince || Date.now() - chatFullAt > 60 * 60e3) { full = true; }
    return call(full ? { action: "chats" } : { action: "chats", since: chatSince }).then(function (d) {
      chatSince = d.now; if (full) { chatFullAt = Date.now(); chats = d.chats; } else { var m = {}; chats.forEach(function (c) { m[c.id] = c; }); d.chats.forEach(function (c) { m[c.id] = c; });
        chats = Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)); }); }
      var un = chats.reduce(function (s, c) { return s + c.unreadAdmin; }, 0);
      if (lastUnread !== null && un > lastUnread && window.chatDing) chatDing(); // chat: só um "ding" suave (sem alerta de pedido)
      lastUnread = un; window.CHATS = chats; drawList(); if (window.onChats) onChats(chats); if (cur && !q("#tChat").hidden) openChat(cur, true);
    }).catch(function () {});
  };
  function drawChat(c) {
    q("#chatTitle").innerHTML = esc(c.nome) + (c.tel ? ' · <a style="color:#25d366" target="_blank" href="https://wa.me/' + phone(c.tel) + '">WhatsApp</a>' : "") + (c.orderId ? ' · <small>Pedido nº ' + esc(c.orderId) + "</small>" : "");
    var el = q("#chatMsgs"), bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
    el.innerHTML = c.msgs.map(function (m) { return '<div class="cm ' + m.de + '">' + esc(m.txt) + "<small>" + (m.de === "bot" ? (m.auto ? "⚙️ Mensagem automática · " : "🤖 Assistente Bravo (IA) · ") : m.de === "loja" ? "Você · " : "") + t(m.em) + "</small></div>"; }).join("") || "<p class='cust'>Sem mensagens.</p>";
    if (bottom) el.scrollTop = 1e6;
  }
  function openChat(id, silent) {
    cur = id; q("#chatList").hidden = true; q("#chatView").hidden = false;
    call({ action: "chatGet", id: id }).then(function (c) { drawChat(c); if (!silent) q("#chatMsgs").scrollTop = 1e6; var x = chats.find(function (y) { return y.id === id; }); if (x) { lastUnread -= x.unreadAdmin; x.unreadAdmin = 0; drawList(); } }).catch(function (e) { alert(e.message); });
  }
  q("#chatList").onclick = function (e) { var d = e.target.closest("[data-chat]"); if (d) openChat(d.dataset.chat); };
  q("#chatBack").onclick = function () { cur = null; q("#chatView").hidden = true; q("#chatList").hidden = false; };
  q("#chatForm").onsubmit = function (e) { e.preventDefault(); var i = e.target.txt, txt = i.value.trim(); if (!txt || !cur) return; i.value = "";
    call({ action: "chatReply", id: cur, txt: txt }).then(function (c) { drawChat(c); q("#chatMsgs").scrollTop = 1e6; }).catch(function (er) { alert(er.message); i.value = txt; }); };
  q("#aiAuto").onchange = function () { var on = this.checked; call({ action: "setAi", aiAuto: on }).then(aiInfo).catch(function (e) { alert(e.message); }); };
  function aiInfo(s) { q("#aiAuto").checked = s.aiAuto !== false; q("#aiInfo").textContent = s.aiKey ? (s.aiAuto ? "(ligada)" : "(desligada)") : "(sem chave AI_API_KEY configurada — não responde mesmo ligada)"; }
  var prevOpen = window.bravoChatOpen; window.bravoChatOpen = function () { return (cur && !q("#tChat").hidden) || (prevOpen ? prevOpen() : false); };
  window.chatStart = function () { if (started) return; started = true; call({ action: "getSettings" }).then(aiInfo).catch(function () {}); };
  if (!q("#panel").hidden) window.chatStart();
})();
/* Uso da IA: custo estimado e orçamento mensal */
(function () {
  var q = function (s) { return document.querySelector(s); };
  var box = document.createElement("div"); box.id = "aiUse"; box.className = "o"; box.style.margin = "8px 0";
  var anchor = q("#aiAuto").closest("label"); anchor.after(box);
  var usd = function (v) { return "US$ " + Number(v || 0).toFixed(4); }, brl = function (v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ","); };
  function draw(u) {
    box.innerHTML = "<h3 style='margin:0 0 6px'>🤖 Uso da IA <small class='est'>" + esc(u.model) + "</small></h3>" +
      (u.blocked ? "<p style='color:#ff5252;font-weight:800'>⚠️ " + u.pctBudget + "% do orçamento do mês usado: a IA está PAUSADA (clientes recebem a mensagem automática e vão para atendimento humano). Aumente o orçamento para religar.</p>" :
        u.pctBudget >= 70 ? "<p style='color:#f5b400;font-weight:700'>⚠️ " + u.pctBudget + "% do orçamento do mês usado (pausa em " + u.stopAtPct + "%).</p>" : "") +
      (u.dailySoftExceeded ? "<p style='color:#f5b400'>⚠️ Hoje passou do limite diário sugerido (" + usd(u.dailySoftLimitUsd) + ").</p>" : "") +
      "<div class='cust'><b>Hoje:</b> " + u.today.replies + " respostas · " + (u.today.in + u.today.out) + " tokens · " + usd(u.today.usd) + " (" + brl(u.today.brl) + ")" + (u.today.erros ? " · " + u.today.erros + " falhas" : "") +
      "<br><b>Mês (" + esc(u.mes) + "):</b> " + u.month.replies + " respostas · " + (u.month.in + u.month.out) + " tokens · " + usd(u.month.usd) + " (" + brl(u.month.brl) + ") · <b>" + u.pctBudget + "%</b> do orçamento" +
      "<div style='height:8px;background:#333;border-radius:4px;margin:6px 0'><div style='height:8px;border-radius:4px;width:" + Math.min(100, u.pctBudget) + "%;background:" + (u.blocked ? "#ff5252" : "#f5b400") + "'></div></div>" +
      "Orçamento mensal: US$ <input id='aiBud' value='" + u.budgetUsd + "' inputmode='decimal' style='width:70px'> · câmbio R$ <input id='aiFx' value='" + u.fxBrl + "' inputmode='decimal' style='width:60px'> <button class='go' id='aiBudSave' style='padding:6px 12px;width:auto'>Salvar</button>" +
      "<br><small>Limite diário sugerido: " + usd(u.dailySoftLimitUsd) + " · Preços (US$/1M tokens): entrada " + u.prices.in + ", cache " + u.prices.cached + ", saída " + u.prices.out + " · estimativa</small></div>";
    q("#aiBudSave").onclick = function () { call({ action: "aiBudget", budgetUsd: q("#aiBud").value, fxBrl: q("#aiFx").value }).then(draw).catch(function (e) { alert(e.message); }); };
  }
  function load() { if (q("#tChat").hidden || document.hidden) return; call({ action: "aiUsage" }).then(draw).catch(function (e) { box.textContent = "Uso da IA: " + e.message; }); }
  q("#atabs").addEventListener("click", function (e) { if (e.target.dataset && e.target.dataset.t === "tChat") setTimeout(load, 50); });
  setInterval(load, 5 * 60e3);
})();
