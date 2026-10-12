// GET ?k=menu-img/<hex>.jpg : fotos do cardápio enviadas pelo painel (guardadas privadas no Blob).
const { getImage } = require('./_lib/store');
module.exports = async (req, res) => {
  const k = String(req.query?.k || '');
  if (!/^menu-img\/[a-f0-9]{16}\.jpg$/.test(k)) return res.status(400).end('bad');
  try { const b = await getImage(k); if (!b) return res.status(404).end('not found');
    res.setHeader('Content-Type', 'image/jpeg'); res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(b);
  } catch (e) { console.error('img', e.message); res.status(500).end('erro'); }
};
