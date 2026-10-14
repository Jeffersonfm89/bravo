// Botão "Baixar/Instalar app" (PWA). Usado pela loja e, separadamente, pelo painel.
(function () {
  var standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {});
  var btn = document.getElementById("installBtn"), bar = document.getElementById("installBar");
  if (!btn || standalone) { if (bar) bar.hidden = true; return; }
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function () { if (bar) bar.hidden = true; });
  var close = document.getElementById("installClose");
  if (close) close.onclick = function () { bar.hidden = true; try { localStorage.setItem("bravoInstallHide", "1"); } catch (_) {} };
  try { if (bar && bar.dataset.dismissible && localStorage.getItem("bravoInstallHide")) { bar.hidden = true; return; } } catch (_) {}
  function tip(msg) {
    var d = document.getElementById("installTip");
    if (!d) { d = document.createElement("div"); d.id = "installTip"; d.className = "itip"; d.setAttribute("role", "dialog");
      d.innerHTML = '<p></p><button type="button" class="go">Entendi</button>'; document.body.appendChild(d);
      d.querySelector("button").onclick = function () { d.hidden = true; }; }
    d.querySelector("p").textContent = msg; d.hidden = false;
  }
  btn.onclick = function () {
    if (deferred) { deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; }); return; }
    if (ios) return tip("No iPhone: toque em Compartilhar (□↑) e depois em \"Adicionar à Tela de Início\".");
    tip("Abra o menu do navegador (⋮) e toque em \"Instalar app\" ou \"Adicionar à tela inicial\".");
  };
  if (bar) bar.hidden = false;
})();
