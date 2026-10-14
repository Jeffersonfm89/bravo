/* Cliente que volta: dados salvos neste aparelho + endereço salvo (mascarado) quando usa outro aparelho. */
(function () {
  var $ = function (s) { return document.querySelector(s); }, F = $("#checkout"), KEY = "bravoMe";
  var me = {}; try { me = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
  me.enderecos = me.enderecos || []; me.refs = me.refs || [];
  var dg = function (t) { return String(t || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""); };
  var fullTxt = function (a) { return a.rua + ", " + a.numero + (a.complemento ? " - " + a.complemento : "") + " - " + a.bairro; };
  var sel = null; window.meRef = null;
  function persist() { localStorage.setItem(KEY, JSON.stringify(me)); }
  function setReq(on) { ["rua", "numero"].forEach(function (n) { var i = F.elements[n]; if (on) { i.dataset.req = 1; i.required = $("[name=tipo]:checked").value == "Entrega"; } else { delete i.dataset.req; i.required = false; } }); }
  function setBairro(v, n) { var s = $("#bairro"); s.value = v; if (s.value !== v && (n || 0) < 30) return setTimeout(function () { setBairro(v, (n || 0) + 1); }, 300); s.dispatchEvent(new Event("change")); }
  function opts() { var tel = dg(F.elements.tel.value), L = [];
    me.enderecos.forEach(function (a, i) { L.push({ k: "l" + i, txt: fullTxt(a), a: a }); });
    me.refs.filter(function (r) { return r.tel === tel; }).forEach(function (r, i) { L.push({ k: "r" + i, txt: r.masked + " (salvo)", r: r }); });
    return L; }
  function pick(k) { sel = k; var L = opts(), o = L.find(function (x) { return x.k === k; });
    window.meRef = null; var hideF = !!o;
    if (o && o.a) { ["rua", "numero", "complemento", "referencia"].forEach(function (n) { F.elements[n].value = o.a[n] || ""; }); setBairro(o.a.bairro); setReq(true); }
    else if (o && o.r) { window.meRef = o.r; ["rua", "numero", "complemento", "referencia"].forEach(function (n) { F.elements[n].value = ""; }); setBairro(o.r.bairro); setReq(false); }
    else { ["rua", "numero", "complemento", "referencia"].forEach(function (n) { F.elements[n].value = ""; }); setBairro(""); setReq(true); }
    $("#addrFields").hidden = hideF; $("#bairro").hidden = hideF; drawPick(); }
  function drawPick() { var L = opts(), P = $("#addrPick"); P.hidden = !L.length; if (!L.length) { $("#addrFields").hidden = false; $("#bairro").hidden = false; return; }
    P.innerHTML = "<b>Endereço de entrega</b>" + L.map(function (o) { return '<label class="apick"><input type="radio" name="apick" value="' + o.k + '"' + (sel === o.k ? " checked" : "") + "> " + esc(o.txt) + "</label>"; }).join("") +
      '<label class="apick"><input type="radio" name="apick" value="new"' + (sel === "new" ? " checked" : "") + "> ➕ Adicionar novo endereço</label>"; }
  $("#addrPick").addEventListener("change", function (e) { if (e.target.name === "apick") pick(e.target.value === "new" ? "new" : e.target.value); });
  function showCard() { if (!me.nome || !me.tel) return; F.elements.nome.value = me.nome; F.elements.tel.value = me.tel; F.elements.email.value = me.email || "";
    $("#meCard").innerHTML = '<div>👋 Olá, <b>' + esc(me.nome.split(" ")[0]) + "</b>!<br><small>" + esc(me.nome) + " · " + esc(me.tel) + "</small></div>" +
      '<div class="mebtns"><button type="button" class="go" id="meOk">Confirmar</button><button type="button" class="ghost" id="meEd">Editar</button></div>';
    $("#meCard").hidden = false; $("#meFields").hidden = true;
    $("#meOk").onclick = function () { F.requestSubmit(); }; $("#meEd").onclick = function () { $("#meCard").hidden = true; $("#meFields").hidden = false; F.elements.nome.focus(); };
    if (opts().length) pick(opts()[0].k); }
  // outro aparelho: consulta por telefone (só 1º nome + endereço mascarado)
  var tmr, asked = {};
  F.elements.tel.addEventListener("input", function () { clearTimeout(tmr); var t = dg(this.value); $("#remote").hidden = true;
    if (window.meRef && window.meRef.tel !== t) pick(opts().length ? opts()[0].k : "new");
    if (t.length < 10 || t.length > 11 || t === dg(me.tel) || asked[t] || typeof API === "undefined" || API === null) return;
    tmr = setTimeout(function () { asked[t] = 1;
      fetch(API + "/api/cliente", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tel: t }) }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d.found || !d.endereco || dg(F.elements.tel.value) !== t) return;
        var R = $("#remote"); R.hidden = false;
        R.innerHTML = "👋 Olá, <b>" + esc(d.primeiroNome) + "</b>! Encontramos seu último endereço:<br><b>" + esc(d.endereco.masked) + '</b><div class="mebtns"><button type="button" class="go" id="rUse">Usar este endereço</button><button type="button" class="ghost" id="rNew">Outro endereço</button></div>';
        $("#rUse").onclick = function () { var r = { tel: t, masked: d.endereco.masked, bairro: d.endereco.bairro, addressRef: d.endereco.addressRef };
          me.refs = [r].concat(me.refs.filter(function (x) { return x.addressRef !== r.addressRef; })).slice(0, 5); R.hidden = true;
          var ent = F.querySelector("[name=tipo][value=Entrega]"); if (!ent.checked) { ent.checked = true; ent.dispatchEvent(new Event("change")); }
          pick(opts().find(function (o) { return o.r && o.r.addressRef === r.addressRef; }).k); };
        $("#rNew").onclick = function () { R.hidden = true; pick("new"); };
      }).catch(function () {}); }, 600); });
  window.meSave = function (c) {
    me.nome = c.nome; me.tel = c.tel; me.email = c.email || "";
    if (c.tipo === "Entrega" && !c.addressRef) { var a = { bairro: c.bairro, rua: c.rua, numero: c.numero, complemento: c.complemento || "", referencia: c.referencia || "" }, k = fullTxt(a).toLowerCase();
      me.enderecos = [a].concat(me.enderecos.filter(function (x) { return fullTxt(x).toLowerCase() !== k; })).slice(0, 5); }
    if (c.addressRef) { var r = me.refs.find(function (x) { return x.addressRef === c.addressRef; }); if (r) me.refs = [r].concat(me.refs.filter(function (x) { return x !== r; })); }
    persist(); sel = null; showCard(); };
  // endereço salvo não achado no servidor: descarta o ref e reabre os campos já com o bairro (nunca o endereço completo)
  window.meRefFail = function (c) { var ref = c && c.addressRef, b = (c && c.bairro) || (window.meRef && window.meRef.bairro) || "";
    me.refs = me.refs.filter(function (x) { return x.addressRef !== ref; }); persist(); window.meRef = null;
    pick("new"); if (b) setBairro(b); $("#addrFields").hidden = false; $("#bairro").hidden = false;
    setTimeout(function () { try { F.elements.rua.focus(); F.elements.rua.scrollIntoView({ block: "center" }); } catch (_) {} }, 350); };
  showCard(); drawPick();
})();
