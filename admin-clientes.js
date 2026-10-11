/* Painel Bravo: Clientes + reativação (listas de chamada). Usa call(), esc(), phone(), CL do admin.html. */
(function () {
  var q = function (s) { return document.querySelector(s); }, sel = new Set(), LISTS = [], curL = null;
  var TPL = [
    ["Saudade", "Olá, {nome}! Sentimos sua falta aqui na Bravo 👑 Que tal um pastel quentinho hoje? Peça em https://bravo-sage.vercel.app 😋"],
    ["Promo do dia", "Oi, {nome}! Hoje tem promoção na Bravo 🔥 Peça pelo site https://bravo-sage.vercel.app e aproveite!"],
    ["Açaí", "{nome}, já experimentou nosso Açaí na Garrafa? 💜 Geladinho e cremoso! Peça em https://bravo-sage.vercel.app"],
    ["Fim de semana", "Fim de semana é dia de Bravo, {nome}! 👑 Pastéis fresquinhos te esperando: https://bravo-sage.vercel.app"]];
  function days(c) { return c.ultimoPedido ? Math.floor((Date.now() - new Date(c.ultimoPedido)) / 864e5) : null; }
  function dt(d) { return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  var css = document.createElement("style");
  css.textContent = ".rbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.rbar select,.rbar input{padding:8px}.cchk{width:22px;height:22px;accent-color:#f5b400;margin-right:6px;vertical-align:middle}" +
    ".lst{background:#121212;border:1px solid #2a2a2a;border-radius:12px;padding:10px;margin-top:10px}.li{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;border-bottom:1px solid #222;padding:8px 0}.li.sent{opacity:.6}.optout{color:#ff8a80;font-weight:700}" +
    ".tpls button{margin:2px}.lst textarea{width:100%;min-height:80px}";
  document.head.appendChild(css);
  q("#qCli").insertAdjacentHTML("afterend", '<div class="rbar"><label>Sem pedir há <select id="fDias"><option value="">todos</option><option>10</option><option>15</option><option>20</option><option>30</option><option>60</option><option value="c">personalizado</option></select></label>' +
    '<input id="fDiasC" type="number" min="1" placeholder="dias" style="width:80px" hidden><span>ou mais dias</span><label><input type="checkbox" id="fOpt"> mostrar quem não quer receber</label></div>' +
    '<div class="rbar"><label><input type="checkbox" id="selAll" class="cchk"> Selecionar todos</label><span id="selN" class="est">0 selecionados</span>' +
    '<select id="toList"></select><button id="addToList" class="go" style="padding:8px 12px">Adicionar à lista de chamada</button></div>');
  q("#cli").insertAdjacentHTML("afterend", '<h4>📋 Listas de chamada</h4><div class="rbar"><input id="newList" placeholder="Nome da nova lista" maxlength="60"><button id="mkList" class="ghost" style="padding:8px 12px">Criar lista</button></div><div id="lists"></div>');
  function filtered() {
    var qq = q("#qCli").value.toLowerCase().trim(), qd = qq.replace(/\D/g, ""), fd = q("#fDias").value, n = fd === "c" ? Number(q("#fDiasC").value || 0) : Number(fd || 0), showOpt = q("#fOpt").checked;
    return CL.filter(function (c) { var d = days(c);
      return (!qq || (c.nome || "").toLowerCase().indexOf(qq) >= 0 || (qd && c.tel.indexOf(qd) >= 0) || ((c.endereco && c.endereco.bairro) || "").toLowerCase().indexOf(qq) >= 0) &&
        (!n || (d !== null && d >= n)) && (showOpt || !c.optOut) && c.pedidos > 0; });
  }
  window.drawCli = function () {
    var L = filtered();
    q("#cli").innerHTML = '<p class="cust">' + L.length + " cliente(s)</p>" + L.map(function (c) { var e = c.endereco, d = days(c);
      return '<div class="o"><h3><span><input type="checkbox" class="cchk" data-sel="' + c.tel + '"' + (sel.has(c.tel) ? " checked" : "") + (c.optOut ? " disabled" : "") + ">" + esc(c.nome || "—") + '</span><span class="st">' + brlFmt(c.totalGasto) + "</span></h3>" +
        '<div class="cust">📞 ' + esc(c.telOriginal || c.tel) + " · " + c.pedidos + " pedido(s) · último: " + (c.ultimoPedido ? dt(c.ultimoPedido) + " · <b>há " + d + " dia(s)</b>" : "—") + "<br>" +
        (e ? "📍 " + esc(e.rua || "") + ", " + esc(e.numero || "") + (e.complemento ? " - " + esc(e.complemento) : "") + " - " + esc(e.bairro || "") : "Retirada no local") +
        (c.optOut ? '<br><span class="optout">🚫 Não quer receber mensagens</span>' : "") + "</div>" +
        '<div class="krow"><a class="wa" target="_blank" href="https://wa.me/' + phone(c.tel) + '">📲 WhatsApp</a><button class="ghost" data-opt="' + c.tel + '" data-v="' + (c.optOut ? 0 : 1) + '">' + (c.optOut ? "Voltar a receber" : "🚫 Não quer receber") + "</button></div></div>";
    }).join("");
    q("#selN").textContent = sel.size + " selecionado(s)";
  };
  ["#qCli", "#fDiasC"].forEach(function (s) { q(s).oninput = drawCli; });
  q("#fDias").onchange = function () { q("#fDiasC").hidden = this.value !== "c"; drawCli(); }; q("#fOpt").onchange = drawCli;
  q("#selAll").onchange = function () { var on = this.checked; filtered().forEach(function (c) { if (!c.optOut) { if (on) sel.add(c.tel); else sel.delete(c.tel); } }); drawCli(); };
  q("#cli").addEventListener("change", function (e) { var t = e.target.dataset && e.target.dataset.sel; if (!t) return; if (e.target.checked) sel.add(t); else sel.delete(t); q("#selN").textContent = sel.size + " selecionado(s)"; });
  q("#cli").addEventListener("click", function (e) { var b = e.target.closest("[data-opt]"); if (!b) return; var v = b.dataset.v === "1";
    if (v && !confirm("Marcar como 'não quer receber'? Ele será excluído das listas de chamada.")) return;
    call({ action: "optOut", tel: b.dataset.opt, optOut: v }).then(function (c) { CL = CL.map(function (x) { return x.tel === c.tel ? c : x; }); if (v) sel.delete(c.tel); drawCli(); }).catch(function (er) { alert(er.message); }); });
  // ---- listas
  function drawLists() {
    q("#toList").innerHTML = '<option value="">Escolha a lista…</option>' + LISTS.map(function (l) { return '<option value="' + l.id + '">' + esc(l.nome) + " (" + l.itens.length + ")</option>"; }).join("");
    q("#lists").innerHTML = LISTS.map(function (l) {
      var open = curL === l.id, sent = l.itens.filter(function (i) { return i.enviadoEm; }).length;
      var h = '<div class="lst"><h3 style="margin:0;display:flex;justify-content:space-between;cursor:pointer" data-open="' + l.id + '"><span>' + (open ? "▼ " : "▶ ") + esc(l.nome) + "</span><small class='est'>" + sent + "/" + l.itens.length + " enviados</small></h3>";
      if (open) {
        h += '<p class="cust">Mensagem ({nome} vira o primeiro nome do cliente):</p><div class="tpls">' + TPL.map(function (t, i) { return '<button class="ghost" style="padding:5px 9px" data-tpl="' + i + '" data-l="' + l.id + '">' + t[0] + "</button>"; }).join("") + "</div>" +
          '<textarea id="tpl_' + l.id + '" maxlength="1000">' + esc(l.template || "") + '</textarea><div class="krow"><button class="go" data-savetpl="' + l.id + '">Salvar mensagem</button><button class="ghost" data-dellist="' + l.id + '">Excluir lista</button></div>' +
          l.itens.map(function (i) {
            return '<div class="li' + (i.enviadoEm ? " sent" : "") + '"><span><b>' + esc(i.nome || "—") + "</b> · " + esc(i.tel) + (i.enviadoEm ? "<br><small class='paid'>✔ Enviado " + dt(i.enviadoEm) + "</small>" : "") + "</span><span>" +
              '<a class="wa" target="_blank" data-send="' + i.tel + '" data-l="' + l.id + '">📲 Enviar no WhatsApp</a> ' +
              (i.enviadoEm ? '<button class="ghost" style="padding:6px 9px" data-unsent="' + i.tel + '" data-l="' + l.id + '">desfazer</button> ' : '<button class="ghost" style="padding:6px 9px" data-sent="' + i.tel + '" data-l="' + l.id + '">Marcar enviado</button> ') +
              '<button class="rm" data-rmtel="' + i.tel + '" data-l="' + l.id + '">remover</button></span></div>';
          }).join("") || "<p class='cust'>Lista vazia: selecione clientes acima e adicione.</p>";
      }
      return h + "</div>";
    }).join("") || "<p class='cust'>Nenhuma lista ainda.</p>";
  }
  function loadLists() { return call({ action: "lists" }).then(function (d) { LISTS = d.lists; drawLists(); }).catch(function (e) { q("#lists").textContent = e.message; }); }
  function upd(l) { LISTS = LISTS.map(function (x) { return x.id === l.id ? l : x; }); if (!LISTS.some(function (x) { return x.id === l.id; })) LISTS.unshift(l); drawLists(); }
  function lu(p) { return call(Object.assign({ action: "listUpdate" }, p)).then(upd).catch(function (e) { alert(e.message); }); }
  q("#mkList").onclick = function () { var n = q("#newList").value.trim(); if (!n) return alert("Dê um nome para a lista");
    call({ action: "listCreate", nome: n }).then(function (l) { q("#newList").value = ""; curL = l.id; upd(l); }).catch(function (e) { alert(e.message); }); };
  q("#addToList").onclick = function () { var id = q("#toList").value; if (!id) return alert("Escolha (ou crie) uma lista"); if (!sel.size) return alert("Selecione clientes");
    lu({ id: id, addTels: Array.from(sel) }).then(function () { sel.clear(); q("#selAll").checked = false; curL = id; drawCli(); drawLists(); }); };
  q("#lists").addEventListener("click", function (e) {
    var t = e.target.closest("[data-open],[data-tpl],[data-savetpl],[data-dellist],[data-send],[data-sent],[data-unsent],[data-rmtel]"); if (!t) return; var d = t.dataset;
    if (d.open) { curL = curL === d.open ? null : d.open; drawLists(); }
    if (d.tpl) q("#tpl_" + d.l).value = TPL[d.tpl][1];
    if (d.savetpl) lu({ id: d.savetpl, template: q("#tpl_" + d.savetpl).value }).then(function () { alert("Mensagem salva"); });
    if (d.dellist && confirm("Excluir esta lista?")) call({ action: "listDelete", id: d.dellist }).then(function () { LISTS = LISTS.filter(function (x) { return x.id !== d.dellist; }); drawLists(); });
    if (d.send) { var l = LISTS.find(function (x) { return x.id === d.l; }), it = l.itens.find(function (x) { return x.tel === d.send; });
      var txt = (q("#tpl_" + d.l).value || l.template || "").replace(/\{nome\}/g, (it.nome || "").split(" ")[0]);
      t.href = "https://wa.me/" + phone(it.tel) + "?text=" + encodeURIComponent(txt);  // abre o WhatsApp; o envio é feito pelo dono
      lu({ id: d.l, sentTel: it.tel }); }
    if (d.sent) lu({ id: d.l, sentTel: d.sent });
    if (d.unsent) lu({ id: d.l, sentTel: d.unsent, unsent: true });
    if (d.rmtel) lu({ id: d.l, removeTel: d.rmtel });
  });
  var oldLoad = window.loadCli;
  window.loadCli = function () { return Promise.resolve(oldLoad()).then(loadLists); };
})();
