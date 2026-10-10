# Bravo – loja online
Static site (GitHub Pages) + Vercel functions in /api for automatic Pix via Mercado Pago.
- Prices: products.js (shared by the site and the server).
- Settings: top of app.js (WHATSAPP_NUMBER, API_BASE).
- Vercel env: MP_ACCESS_TOKEN (required), MP_WEBHOOK_SECRET (optional), PAYER_FALLBACK_EMAIL (optional), SITE_ORIGIN (optional, extra CORS origin).
- Local test with simulated MP: `node test/dev-mock.js` and open http://localhost:8766
