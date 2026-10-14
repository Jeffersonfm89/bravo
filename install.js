// Botão "Baixar/Instalar app" (PWA). Android/PC: beforeinstallprompt. iPhone: dica de Compartilhar.
(function () {
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {});
  var btn = document.getElementById("installBtn"), bar = document.getElementById("installBar");
  if (!btn || standalone) { if (bar) bar.hidden = true; return; }
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var deferred = null, KEY = "bravoInstallHide";
  function show() { if (bar && !sessionStorage.getItem(KEY)) bar.hidden = false; }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; show(); });
  window.addEventListener("appinstalled", function () { if (bar) bar.hidden = true; });
  if (ios) show();
  btn.onclick = function () {
    if (deferred) { deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; }); return; }
    var t = document.getElementById("iosTip");
    if (t) t.hidden = false; else alert("No iPhone: toque em Compartilhar e depois em Adicionar à Tela de Início.");
  };
  var x = document.getElementById("installClose");
  if (x) x.onclick = function () { bar.hidden = true; try { sessionStorage.setItem(KEY, "1"); } catch (e) {} };
  var tc = document.getElementById("iosTipClose");
  if (tc) tc.onclick = function () { document.getElementById("iosTip").hidden = true; };
})();
