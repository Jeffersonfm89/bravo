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
  window.loadChats = function (showList) {
    return call({ action: "chats" }).then(function (d) {
      chats = d.chats; var un = chats.reduce(function (s, c) { return s + c.unreadAdmin; }, 0);
      if (lastUnread !== null && un > lastUnread && window.bravoAlert) { var c = chats.find(function (x) { return x.unreadAdmin; }); bravoAlert("NOVA MENSAGEM de " + (c ? c.nome : "cliente"), c && c.last ? c.last.txt.slice(0, 100) : ""); }
      lastUnread = un; window.CHATS = chats; drawList(); if (window.onChats) onChats(chats); if (cur && !q("#tChat").hidden) openChat(cur, true);
    }).catch(function () {});
  };
  function drawChat(c) {
    q("#chatTitle").innerHTML = esc(c.nome) + (c.tel ? ' · <a style="color:#25d366" target="_blank" href="https://wa.me/' + phone(c.tel) + '">WhatsApp</a>' : "") + (c.orderId ? ' · <small>Pedido nº ' + esc(c.orderId) + "</small>" : "");
    var el = q("#chatMsgs"), bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
    el.innerHTML = c.msgs.map(function (m) { return '<div class="cm ' + m.de + '">' + esc(m.txt) + "<small>" + (m.de === "bot" ? "IA · " : m.de === "loja" ? "Você · " : "") + t(m.em) + "</small></div>"; }).join("") || "<p class='cust'>Sem mensagens.</p>";
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
  function aiInfo(s) { q("#aiAuto").checked = !!s.aiAuto; q("#aiInfo").textContent = s.aiKey ? (s.aiAuto ? "(ligada)" : "(desligada)") : "(sem chave AI_API_KEY configurada — não responde mesmo ligada)"; }
  window.chatStart = function () { if (started) return; started = true; loadChats(); setInterval(loadChats, 10000); call({ action: "getSettings" }).then(aiInfo).catch(function () {}); };
  if (!q("#panel").hidden) window.chatStart();
})();
