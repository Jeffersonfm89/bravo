#!/bin/sh
# Cache-busting: adiciona ?v=<data-hora> nos .js/.css locais das páginas. Rode antes de cada deploy.
V=$(date +%Y%m%d%H%M%S)
for f in index.html pedido.html admin.html; do
  sed -i -E "s#(src|href)=\"([a-z0-9-]+\.(js|css))(\?v=[0-9]+)?\"#\1=\"\2?v=$V\"#g" "$f"
done
# registra o service worker com versão também
sed -i -E "s/var VERSION = \"bravo-[0-9]+\"/var VERSION = \"bravo-$V\"/" sw.js
echo "versão $V"
