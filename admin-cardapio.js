/* Painel Bravo: aba Cardápio — criar/editar itens (nome, categoria, preço, foto, descrição, disponível). Usa call(), esc() do admin.html. */
(function () {
  var q = function (s) { return document.querySelector(s); }, P = [], CATS = [], editing = null, newImg = null;
  var money = function (v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ","); };
  var dec = function (v) { return Number(v || 0).toFixed(2).replace(".", ","); };
  var imgSrc = function (s) { return /^\/api\//.test(s || "") ? API + s : (s || "img/logo.jpg"); };
  var css = document.createElement("style");
  css.textContent = ".mc{display:flex;gap:10px;align-items:center;background:#1b1b1b;border-radius:10px;padding:8px;margin:6px 0}.mc img{width:64px;height:64px;object-fit:cover;border-radius:8px;flex:none}.mc .i{flex:1;min-width:0}.mc .i small{color:#aaa;display:block;overflow:hidden;text-overflow:ellipsis}.mc.off{opacity:.5}.mc button{padding:8px 12px}.mf label{display:block;margin:10px 0 4px;font-weight:700}.mf input,.mf textarea,.mf select{width:100%;box-sizing:border-box;font-size:16px}.mf .prev{width:140px;height:140px;object-fit:cover;border-radius:10px;display:block;margin:6px 0}.mf table td{padding:3px}.mf table input{width:90px}.tagoff{background:#555;color:#fff;border-radius:6px;padding:1px 6px;font-size:12px;margin-left:4px}";
  document.head.appendChild(css);
  window.loadCard = async function () { q("#card").innerHTML = "<p>Carregando cardápio…</p>"; try { var d = await call({ action: "menuGet" }); P = d.products; CATS = d.cats; list(); } catch (e) { q("#card").innerHTML = "<p>" + esc(e.message) + "</p>"; } };
  function cats() { var s = CATS.slice(); P.forEach(function (p) { if (s.indexOf(p.cat) < 0) s.push(p.cat); }); return s; }
  function fromTxt(p) { if (!p.options) return money(p.price); var t = p.options.find(function (g) { return g.type === "single" && g.min; }); return (p.price ? money(p.price) : "") + (t ? (p.price ? " + " : "a partir de ") + money(Math.min.apply(null, t.choices.map(function (c) { return c.price; }))) : ""); }
  function list() {
    editing = null;
    q("#card").innerHTML = '<button class="go" id="mNew">➕ Novo item</button><p class="cust">Toque em <b>Editar</b> para mudar preço, foto, nome ou descrição. As mudanças valem na hora para a loja e para a cobrança.</p>' +
      cats().map(function (c) { var ps = P.filter(function (p) { return p.cat === c; }); if (!ps.length) return "";
        return "<h3>" + esc(c) + "</h3>" + ps.map(function (p) { return '<div class="mc' + (p.ativo === false ? " off" : "") + '"><img src="' + esc(imgSrc(p.img)) + '" alt=""><div class="i"><b>' + esc(p.name) + "</b>" + (p.ativo === false ? '<span class="tagoff">indisponível</span>' : "") + "<small>" + esc(p.desc || "") + "</small><b style=\"color:#f5b400\">" + fromTxt(p) + '</b></div><button class="ghost" data-ed="' + esc(p.id) + '">Editar</button></div>'; }).join(""); }).join("");
  }
  function form(p) {
    editing = p; newImg = null; var isNew = !p.id, cs = cats();
    var groups = (p.options || []).filter(function (g) { return g.id !== "sem"; }).map(function (g) {
      if (g.padds) return "<p class=\"cust\"><b>" + esc(g.label) + ":</b> o preço dos adicionais de pastel é ajustado na aba <b>Taxas de entrega</b> (vale para todos os pastéis).</p>";
      return "<label>" + esc(g.label) + " (preço de cada opção)</label><table>" + g.choices.map(function (c) { return "<tr><td>" + esc(c.name) + '</td><td>R$ <input inputmode="decimal" data-g="' + esc(g.id) + '" data-c="' + esc(c.id) + '" value="' + dec(c.price) + '"></td></tr>'; }).join("") + "</table>"; }).join("");
    q("#card").innerHTML = '<div class="mf"><button class="ghost" id="mBack" style="padding:6px 12px">← Voltar</button><h3>' + (isNew ? "Novo item" : "Editar item") + "</h3>" +
      '<label>Foto</label><img class="prev" id="mPrev" src="' + esc(imgSrc(p.img)) + '"><input type="file" id="mFile" accept="image/*"><small class="est" id="mImgInfo"></small>' +
      '<label>Nome</label><input id="mName" maxlength="80" value="' + esc(p.name || "") + '">' +
      '<label>Categoria</label><select id="mCat">' + cs.map(function (c) { return "<option" + (c === p.cat ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + '<option value="__new">➕ Nova categoria…</option></select><input id="mCatNew" maxlength="30" placeholder="Nome da nova categoria" hidden>' +
      "<label>Preço" + (p.options && !p.price ? " base (opcional, soma com as opções)" : "") + '</label>R$ <input id="mPrice" inputmode="decimal" style="width:120px" value="' + (isNew ? "" : dec(p.price)) + '">' + groups +
      '<label>Descrição / ingredientes (opcional)</label><textarea id="mDesc" maxlength="250" rows="3" placeholder="Ex.: Frango desfiado, catupiry e orégano">' + esc(p.desc || "") + "</textarea>" +
      '<label class="r" style="font-weight:700"><input type="checkbox" id="mAtivo"' + (p.ativo === false ? "" : " checked") + " style=\"width:auto\"> Disponível (desmarque para esconder da loja sem excluir)</label>" +
      '<button class="go" id="mSave">Salvar</button>' + (p.custom ? '<button class="ghost" id="mDel" style="margin-top:14px;color:#f66">🗑️ Excluir item</button>' : "") + "</div>";
    q("#mCat").onchange = function () { q("#mCatNew").hidden = this.value !== "__new"; };
    q("#mFile").onchange = function () { var f = this.files[0]; if (!f) return; q("#mImgInfo").textContent = "Preparando foto…"; shrink(f).then(function (d) { newImg = d; q("#mPrev").src = d; q("#mImgInfo").textContent = "Foto pronta (" + Math.round(d.length * 0.75 / 1024) + " KB). Toque em Salvar."; }).catch(function () { q("#mImgInfo").textContent = "Não consegui abrir essa foto. Tente outra."; }); };
  }
  function shrink(file) { return new Promise(function (ok, no) { var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { var m = 800, s = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); var d = c.toDataURL("image/jpeg", 0.8); if (d.length > 1.9e6) d = c.toDataURL("image/jpeg", 0.6); ok(d); }; im.onerror = no; im.src = u; }); }
  async function save() {
    var p = editing, b = q("#mSave"), cat = q("#mCat").value === "__new" ? q("#mCatNew").value.trim() : q("#mCat").value;
    var price = q("#mPrice").value.trim(); if (!price && p.options) price = "0";
    var body = { action: p.id ? "menuSave" : "menuCreate", id: p.id, name: q("#mName").value, cat: cat, price: price, desc: q("#mDesc").value, ativo: q("#mAtivo").checked };
    var ins = document.querySelectorAll(".mf [data-g]"); if (ins.length) { body.choices = {}; ins.forEach(function (i) { (body.choices[i.dataset.g] = body.choices[i.dataset.g] || {})[i.dataset.c] = i.value; }); }
    b.disabled = true; b.textContent = "Salvando…";
    try { if (newImg) { b.textContent = "Enviando foto…"; body.img = (await call({ action: "menuImg", data: newImg })).img; }
      await call(body); await loadCard(); alert("Salvo! Aparece na loja em até 2 minutos.");
    } catch (e) { alert(e.message.replace(/^Erro ao carregar: /, "")); b.disabled = false; b.textContent = "Salvar"; }
  }
  document.addEventListener("click", async function (e) {
    var t = e.target; if (!q("#tCard") || !q("#tCard").contains(t)) return;
    if (t.dataset.ed) form(P.find(function (p) { return p.id === t.dataset.ed; }));
    else if (t.id === "mNew") form({ cat: cats()[0] });
    else if (t.id === "mBack") list();
    else if (t.id === "mSave") save();
    else if (t.id === "mDel") { if (!confirm('Excluir "' + editing.name + '" do cardápio? Isso não pode ser desfeito.')) return; try { await call({ action: "menuDelete", id: editing.id }); await loadCard(); } catch (err) { alert(err.message); } }
  });
})();
