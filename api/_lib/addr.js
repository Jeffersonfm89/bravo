// Endereços salvos por cliente + token opaco (addressRef) amarrado ao telefone.
const crypto = require('crypto');
const KEY = () => crypto.createHash('sha256').update('bravo-addr|' + (process.env.ADDR_SECRET || process.env.ADMIN_PASSWORD || 'dev')).digest();
const digits = t => String(t || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
const sig = (tel, id) => crypto.createHmac('sha256', KEY()).update(digits(tel) + '|' + id).digest('base64url').slice(0, 22);
const makeRef = (tel, id) => id + '.' + sig(tel, id);
function checkRef(ref, tel) { const [id, s] = String(ref || '').split('.'); if (!id || !s) return null; const e = sig(tel, id);
  return s.length === e.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e)) ? id : null; }
const norm = a => [a.rua, a.numero, a.complemento, a.bairro].map(x => String(x || '').toLowerCase().replace(/\s+/g, ' ').trim()).join('|');
function addrList(c) { if (Array.isArray(c.enderecos)) return c.enderecos; return c.endereco && c.endereco.rua ? [{ ...c.endereco, id: legacyId(c.endereco) }] : []; }
// id estável para cadastro antigo (só `endereco`): antes era aleatório a cada leitura e o addressRef nunca batia
const legacyId = a => 'l' + crypto.createHash('sha256').update(norm(a)).digest('hex').slice(0, 8);
function pushAddr(c, a) { // último usado primeiro, sem duplicar, máx. 5
  const L = addrList(c), n = norm(a), old = L.find(x => norm(x) === n);
  const e = { id: old ? old.id : crypto.randomBytes(4).toString('hex'), bairro: a.bairro, rua: a.rua, numero: a.numero, complemento: a.complemento, referencia: a.referencia };
  c.enderecos = [e, ...L.filter(x => norm(x) !== n)].slice(0, 5); return e;
}
function mask(a) { const w = String(a.rua || '').trim().split(/\s+/), tipos = /^(rua|r\.?|av\.?|avenida|travessa|tv\.?|servid[aã]o|estrada|rodovia|alameda|pra[cç]a)$/i;
  let i = 0, out = []; if (w.length > 1 && tipos.test(w[0])) { out.push(w[0]); i = 1; }
  if (w[i]) out.push(w[i].slice(0, 3) + '***');
  return `${out.join(' ')}, ${a.numero || ''} - ${a.bairro || ''}`; }
module.exports = { makeRef, checkRef, addrList, pushAddr, mask, digits };
