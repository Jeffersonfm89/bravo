/* ====== CONFIGURAÇÃO DA LOJA (edite aqui) ====== */
// Número do WhatsApp da Bravo com DDI+DDD, só dígitos, ex.: "5511999998888". Vazio = mostra resumo para copiar.
var WHATSAPP_NUMBER = "5547996158639";
// URL da API na Vercel (ex.: "https://bravo.vercel.app"). Vazio = usa a mesma origem se a página estiver na Vercel;
// no GitHub Pages, vazio = Pix automático desativado (pedido segue pelo WhatsApp como antes).
var API_BASE = "https://bravojoinville.com.br";
// Endereço público da loja usado no link de acompanhamento (vazio = endereço atual).
var SITE_URL = "https://bravojoinville.com.br/";
// Base da API efetivamente usada: mesma origem quando a página está no domínio da loja/Vercel/localhost; senão API_BASE; null = sem servidor.
var API = (/vercel\.app$/.test(location.hostname) || /(^|\.)bravojoinville\.com\.br$/.test(location.hostname) || location.hostname == "localhost") ? "" : (API_BASE ? API_BASE.replace(/\/$/, "") : null);
