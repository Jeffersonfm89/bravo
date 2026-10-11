/* Widget de atendimento: "Chamar no WhatsApp" + "Chat no app". Requer app-config.js (WHATSAPP_NUMBER, API). */
(function () {
  var LS = localStorage, KEY = "bravoChat", st = JSON.parse(LS.getItem(KEY) || "null"), open = false, timer = null, lastN = 0;
  function orderId() { var m = location.search.match(/[?&]id=([A-Z0-9-]+)/); return m ? m[1] : (LS.getItem("bravoLastOrder") || ""); }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var css = document.createElement("style");
  css.textContent = ".cw-btns{position:fixed;right:12px;bottom:12px;z-index:8;display:flex;flex-direction:column;gap:8px;align-items:flex-end}" +
    ".cw-btns a,.cw-btns button{border:0;border-radius:24px;padding:11px 15px;font-weight:800;font-size:14px;text-decoration:none;box-shadow:0 3px 10px #0008;cursor:pointer}" +
    ".cw-wa{background:#25d366;color:#000}.cw-open{background:#f5b400;color:#000;position:relative}.cw-badge{position:absolute;top:-6px;right:-4px;background:#ff3b30;color:#fff;border-radius:10px;padding:1px 6px;font-size:12px}" +
    ".cw-panel{position:fixed;right:0;bottom:0;z-index:13;width:min(380px,100%);height:min(560px,85vh);background:#111;border:1px solid #333;border-radius:16px 16px 0 0;display:flex;flex-direction:column}" +
    ".cw-panel[hidden]{display:none}.cw-h{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #222}.cw-h button{background:none;border:0;color:#fff;font-size:22px}" +
    ".cw-msgs{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px}.cw-m{max-width:80%;padding:8px 10px;border-radius:12px;font-size:14px;white-space:pre-wrap;word-wrap:break-word}" +
    ".cw-m.cliente{align-self:flex-end;background:#f5b400;color:#000}.cw-m.loja,.cw-m.bot{align-self:flex-start;background:#262626;color:#fff}.cw-m small{display:block;opacity:.6;font-size:10px}" +
    ".cw-f{display:flex;gap:6px;padding:8px;border-top:1px solid #222}.cw-f input,.cw-start input{flex:1;background:#1c1c1c;color:#fff;border:1px solid #333;border-radius:10px;padding:10px;font-size:16px}" +
    ".cw-f button,.cw-start button{background:#f5b400;border:0;border-radius:10px;padding:10px 14px;font-weight:800}.cw-start{padding:14px;display:flex;flex-direction:column;gap:8px}";
  document.head.appendChild(css);
  var box = document.createElement("div");
  box.innerHTML = '<div class="cw-btns"><a class="cw-wa" target="_blank" rel="noopener">💬 Chamar no WhatsApp</a><button class="cw-open">🗨️ Chat no app<span class="cw-badge" hidden>0</span></button></div>' +
    '<div class="cw-panel" hidden><div class="cw-h"><b>Atendimento Bravo</b><button class="cw-x" aria-label="Fechar">✕</button></div>' +
    '<form class="cw-start"><p style="margin:0">Fale com a gente por aqui 👋</p><input name="nome" placeholder="Seu nome" maxlength="60" required><input name="tel" type="tel" placeholder="Telefone (opcional)" maxlength="30"><button>Começar conversa</button></form>' +
    '<div class="cw-msgs" hidden></div><form class="cw-f" hidden><input name="txt" placeholder="Digite sua mensagem" maxlength="500" autocomplete="off"><button>Enviar</button></form></div>';
  document.body.appendChild(box);
  var $ = function (s) { return box.querySelector(s); };
  function waHref() { var id = orderId(), t = "Olá, Bravo! " + (id ? "Sobre o pedido nº " + id + ": " : ""); return "https://wa.me/" + (typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : "") + "?text=" + encodeURIComponent(t); }
  $(".cw-wa").href = waHref(); $(".cw-wa").onclick = function () { this.href = waHref(); };
  if (typeof API === "undefined" || API === null) { $(".cw-open").hidden = true; return; }
  function show() { var started = !!st; $(".cw-start").hidden = started; $(".cw-msgs").hidden = !started; $(".cw-f").hidden = !started; }
  function draw(c) {
    var m = c.msgs || [];
    $(".cw-msgs").innerHTML = '<div class="cw-m loja">Olá, ' + e(c.nome) + '! Como podemos ajudar?' + (c.orderId ? "<small>Pedido nº " + e(c.orderId) + "</small>" : "") + "</div>" +
      m.map(function (x) { return '<div class="cw-m ' + x.de + '">' + e(x.txt) + "<small>" + (x.de === "bot" ? "Assistente automático · " : x.de === "loja" ? "Bravo · " : "") + new Date(x.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) + "</small></div>"; }).join("");
    if (m.length !== lastN) { $(".cw-msgs").scrollTop = 1e6; }
    var replies = m.filter(function (x) { return x.de !== "cliente"; }).length, seen = Number(LS.getItem(KEY + "Seen") || 0);
    if (open) LS.setItem(KEY + "Seen", replies); else if (replies > seen) { $(".cw-badge").hidden = false; $(".cw-badge").textContent = replies - seen; }
    lastN = m.length;
  }
  function poll() { if (!st) return; fetch(API + "/api/chat?id=" + st.id + "&token=" + st.token).then(function (r) { if (r.status === 404) { st = null; LS.removeItem(KEY); show(); return null; } return r.json(); }).then(function (c) { if (c) draw(c); }).catch(function () {}); }
  function schedule() { clearInterval(timer); timer = setInterval(poll, open ? 4000 : 20000); }
  $(".cw-open").onclick = function () { open = true; $(".cw-panel").hidden = false; $(".cw-badge").hidden = true; show(); poll(); schedule(); };
  $(".cw-x").onclick = function () { open = false; $(".cw-panel").hidden = true; schedule(); };
  $(".cw-start").onsubmit = function (ev) { ev.preventDefault(); var f = ev.target, b = f.querySelector("button"); b.disabled = true;
    fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", nome: f.nome.value, tel: f.tel.value, orderId: orderId() }) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error); return d; }); })
      .then(function (d) { st = d; LS.setItem(KEY, JSON.stringify(d)); show(); poll(); }).catch(function (er) { alert(er.message); }).then(function () { b.disabled = false; }); };
  $(".cw-f").onsubmit = function (ev) { ev.preventDefault(); var i = ev.target.txt, t = i.value.trim(); if (!t) return; i.value = "";
    fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", id: st.id, token: st.token, txt: t }) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error); return d; }); }).then(draw).catch(function (er) { alert(er.message); i.value = t; }); };
  show(); if (st) { poll(); schedule(); }
})();
