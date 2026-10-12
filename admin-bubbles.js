/* Painel Bravo: bolhas flutuantes de conversa (estilo Messenger), em todas as abas. Usa call(), esc(), phone(). */
(function () {
  var KEY = "bravoBubbles", st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
  var byId = {}, data = {}, timers = {}, mob = function () { return innerWidth < 700; };
  var css = document.createElement("style");
  css.textContent = "#bubWrap{position:fixed;right:14px;bottom:14px;z-index:9000;display:flex;flex-direction:column-reverse;gap:10px;align-items:flex-end}" +
    ".cbub{position:relative;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f5b400,#d48c00);color:#111;font-weight:900;font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 14px #000a;border:2px solid #fff;user-select:none}" +
    ".cbub .bn{position:absolute;top:-4px;right:-4px;background:#e53935;color:#fff;border-radius:999px;min-width:22px;height:22px;font-size:12px;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #111}" +
    ".cbub .bl{position:absolute;right:64px;white-space:nowrap;background:#111;color:#fff;font-size:12px;padding:3px 8px;border-radius:8px;opacity:.9;max-width:160px;overflow:hidden;text-overflow:ellipsis}" +
    ".cbub.pulse{animation:bpulse 1s ease-in-out infinite}@keyframes bpulse{0%,100%{box-shadow:0 0 0 0 #f5b400cc}50%{box-shadow:0 0 0 12px #f5b40000;transform:scale(1.08)}}" +
    "#winWrap{position:fixed;right:84px;bottom:0;z-index:9001;display:flex;gap:10px;align-items:flex-end}" +
    ".cwin{width:320px;height:430px;background:#141414;border:1px solid #f5b40088;border-bottom:0;border-radius:12px 12px 0 0;display:flex;flex-direction:column;box-shadow:0 -4px 20px #000a}" +
    ".cwin header{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#f5b400;color:#111;border-radius:12px 12px 0 0;font-weight:800}.cwin header span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".cwin header button{background:#111;color:#fff;border:0;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer}.cwin .wm{flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:6px}.cwin form{display:flex;gap:6px;padding:8px;border-top:1px solid #333}.cwin form input{flex:1;padding:9px;border-radius:8px;border:1px solid #444;background:#222;color:#fff}.cwin form button{padding:8px 12px;border:0;border-radius:8px;background:#f5b400;font-weight:800}" +
    "@media(max-width:699px){#winWrap{left:0;right:0}.cwin{width:100%;height:70vh}#bubWrap{bottom:14px}}" +
    "@media(prefers-reduced-motion:reduce){.cbub.pulse{animation:none;outline:3px solid #e53935}}";
  document.head.appendChild(css);
  var bw = document.createElement("div"); bw.id = "bubWrap"; document.body.appendChild(bw);
  var ww = document.createElement("div"); ww.id = "winWrap"; document.body.appendChild(ww);
  function save() { localStorage.setItem(KEY, JSON.stringify(st)); }
  function ini(n) { var w = String(n || "?").trim().split(/\s+/); return ((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase(); }
  function t(d) { return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }); }
  function draw() {
    bw.innerHTML = Object.keys(st).filter(function (id) { return byId[id]; }).map(function (id) { var c = byId[id], un = st[id] === "open" ? 0 : c.unreadAdmin;
      return '<div class="cbub' + (un ? " pulse" : "") + '" data-b="' + id + '" title="' + esc(c.nome) + '">' + esc(ini(c.nome)) + (un ? '<span class="bn">' + un + "</span>" : "") + '<span class="bl">' + (c.precisaHumano ? "🙋 " : "") + esc(c.nome) + (c.precisaHumano ? " quer atendente" : "") + "</span></div>"; }).join("");
    Object.keys(st).forEach(function (id) { var w = document.getElementById("cw_" + id); if (st[id] === "open" && byId[id] && !w) mkWin(id); if (st[id] !== "open" && w) { w.remove(); clearInterval(timers[id]); } });
  }
  function msgs(id) { var c = data[id], el = document.querySelector("#cw_" + id + " .wm"); if (!c || !el) return; var bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
    el.innerHTML = c.msgs.map(function (m) { return '<div class="cm ' + m.de + '">' + esc(m.txt) + "<small>" + (m.de === "loja" ? "Você · " : m.de === "bot" ? "🤖 Assistente Bravo (IA) · " : "") + t(m.em) + "</small></div>"; }).join("") || "<p class='cust'>Sem mensagens.</p>"; if (bottom) el.scrollTop = 1e6;
    var tg = document.querySelector("#cw_" + id + " [data-ai]"); if (tg) { tg.dataset.h = c.humano ? 1 : 0; tg.textContent = c.humano ? "👤 Humano" : "🤖 IA ativa"; tg.title = c.humano ? "Atendimento humano (IA não responde). Clique para devolver à IA" : "IA respondendo. Clique para assumir (humano)"; } }
  function fetchC(id) { return call({ action: "chatGet", id: id }).then(function (c) { data[id] = c; if (byId[id]) byId[id].unreadAdmin = 0; msgs(id); }).catch(function () {}); }
  function mkWin(id) { var c = byId[id], w = document.createElement("div"); w.className = "cwin"; w.id = "cw_" + id;
    w.innerHTML = "<header><span>" + esc(c.nome) + (c.orderId ? " · nº " + esc(c.orderId) : "") + "</span>" + (c.tel ? '<a target="_blank" style="color:#111" href="https://wa.me/' + phone(c.tel) + '">📲</a>' : "") +
      '<button data-ai="' + id + '">…</button><button data-min="' + id + '" title="Minimizar">—</button><button data-close="' + id + '" title="Fechar">✕</button></header><div class="wm">Carregando…</div><form data-f="' + id + '"><input name="txt" maxlength="1000" placeholder="Responder…" autocomplete="off"><button>Enviar</button></form>';
    ww.appendChild(w); fetchC(id).then(function () { w.querySelector(".wm").scrollTop = 1e6; }); clearInterval(timers[id]); timers[id] = setInterval(function () { fetchC(id); }, 4000); }
  function open(id) { if (mob()) Object.keys(st).forEach(function (k) { if (k !== id && st[k] === "open") st[k] = "bubble"; }); st[id] = "open"; save(); draw(); }
  bw.addEventListener("click", function (e) { var b = e.target.closest("[data-b]"); if (!b) return; var id = b.dataset.b; if (st[id] === "open") { st[id] = "bubble"; save(); draw(); } else open(id); });
  ww.addEventListener("click", function (e) { var m = e.target.closest("[data-min]"), x = e.target.closest("[data-close]");
    var ai = e.target.closest("[data-ai]"); if (ai) { var id0 = ai.dataset.ai; call({ action: "chatHumano", id: id0, humano: ai.dataset.h !== "1" }).then(function (c) { data[id0] = c; msgs(id0); }).catch(function (er) { alert(er.message); }); }
    if (m) { st[m.dataset.min] = "bubble"; save(); draw(); }
    if (x) { var id = x.dataset.close; delete st[id]; save(); draw(); if (byId[id]) byId[id].fechado = true; call({ action: "chatClose", id: id }).then(function () { if (window.loadChats) loadChats(); }).catch(function (er) { alert(er.message); }); } });
  ww.addEventListener("submit", function (e) { e.preventDefault(); var id = e.target.dataset.f, i = e.target.txt, txt = i.value.trim(); if (!txt) return; i.value = "";
    call({ action: "chatReply", id: id, txt: txt }).then(function (c) { data[id] = c; msgs(id); document.querySelector("#cw_" + id + " .wm").scrollTop = 1e6; }).catch(function (er) { alert(er.message); i.value = txt; }); });
  window.onChats = function (chats) { byId = {}; chats.forEach(function (c) { byId[c.id] = c; if (!c.fechado && c.unreadAdmin > 0 && !st[c.id]) st[c.id] = "bubble"; });
    Object.keys(st).forEach(function (id) { if (!byId[id] || (byId[id].fechado && st[id] !== "open")) delete st[id]; }); save(); draw(); };
  window.openChatBubble = open;
  // sininho discreto no canto superior direito
  var bell = document.createElement("button"); bell.id = "chatBell"; bell.title = "Mensagens não lidas"; bell.innerHTML = '🔔<span class="bn" hidden></span>'; bell.hidden = true; document.body.appendChild(bell);
  css.textContent += "#chatBell{position:fixed;top:12px;right:12px;z-index:9002;width:40px;height:40px;border-radius:50%;border:1px solid #f5b40088;background:#1a1a1a;font-size:18px;cursor:pointer}#chatBell .bn{position:absolute;top:-5px;right:-5px;background:#e53935;color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0 4px}#chatBell .bn[hidden],#chatBell[hidden]{display:none}body>header{padding-right:64px!important}";
  bell.onclick = function () { var c = Object.keys(byId).map(function (k) { return byId[k]; }).find(function (x) { return x.unreadAdmin && !x.fechado; });
    if (c) open(c.id); else { var t = document.querySelector('[data-t=tChat]'); if (t) t.click(); } };
  var oc = window.onChats; window.onChats = function (chats) { oc(chats); var un = chats.reduce(function (s, c) { return s + (c.fechado ? 0 : c.unreadAdmin); }, 0), n = bell.querySelector(".bn"); n.hidden = !un; n.textContent = un; bell.hidden = false; };
  var ac; window.chatDing = function () { // "plim-plim": 2 notas agudas, suave, toca 1 vez (diferente do alarme de pedido)
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); var t0 = ac.currentTime;
      [[1568, 0], [2093, 0.16]].forEach(function (n) { var o = ac.createOscillator(), g = ac.createGain(), t = t0 + n[1];
        o.type = "sine"; o.frequency.setValueAtTime(n[0], t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.4); }); } catch (_) {} };
})();
