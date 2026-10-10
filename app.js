/* ====== CONFIGURAÇÃO (edite aqui) ====== */
// Número do WhatsApp da Bravo com DDI+DDD, só dígitos, ex.: "5511999998888". Vazio = mostra resumo para copiar.
const WHATSAPP_NUMBER = "";
// URL da API na Vercel (ex.: "https://bravo.vercel.app"). Vazio = usa a mesma origem se a página estiver na Vercel;
// no GitHub Pages, vazio = Pix automático desativado (pedido segue pelo WhatsApp como antes).
const API_BASE = "";
// Os produtos e preços ficam em products.js
/* ====================================== */
const $=s=>document.querySelector(s),brl=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
let cart=JSON.parse(localStorage.getItem("bravoCart")||"{}");let cat="all";
const save=()=>{localStorage.setItem("bravoCart",JSON.stringify(cart));render()};
function grid(){$("#grid").innerHTML=PRODUCTS.filter(p=>cat=="all"||p.cat==cat).map(p=>`<div class="card"><img src="${p.img}" alt="${p.name}" loading="lazy"><div class="b"><h3>${p.name}</h3><small>${p.desc}</small><div class="p">${brl(p.price)}</div><button class="add" data-id="${p.id}">Adicionar</button></div></div>`).join("")}
function total(){return Object.entries(cart).reduce((s,[id,q])=>s+(PRODUCTS.find(p=>p.id==id)?.price||0)*q,0)}
function render(){const n=Object.values(cart).reduce((a,b)=>a+b,0);$("#count").textContent=n;
$("#items").innerHTML=n?Object.entries(cart).map(([id,q])=>{const p=PRODUCTS.find(x=>x.id==id);if(!p)return"";return`<div class="it"><img src="${p.img}" alt=""><div class="n">${p.name}<br><b>${brl(p.price*q)}</b><br><button class="rm" data-rm="${id}">Remover</button></div><div class="q"><button data-dec="${id}">−</button><span>${q}</span><button data-inc="${id}">+</button></div></div>`}).join(""):"<p>Seu carrinho está vazio.</p>";
$("#total").textContent=brl(total())}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("s");setTimeout(()=>e.classList.remove("s"),1400)}
function openCart(o){$("#drawer").classList.toggle("open",o);$("#overlay").hidden=!o;if(o&&$("#pix").hidden){$("#checkout").hidden=false;$("#summary").hidden=true}}
document.addEventListener("click",e=>{const d=e.target.dataset;
if(d.id){cart[d.id]=(cart[d.id]||0)+1;save();toast("Adicionado ao carrinho!")}
if(d.inc){cart[d.inc]++;save()} if(d.dec){if(--cart[d.dec]<=0)delete cart[d.dec];save()} if(d.rm){delete cart[d.rm];save()}
if(d.cat){cat=d.cat;document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b==e.target));grid()}});
$("#cartBtn").onclick=()=>openCart(true);$("#closeCart").onclick=$("#overlay").onclick=()=>openCart(false);
document.querySelectorAll("[name=tipo]").forEach(r=>r.onchange=()=>{const ent=$("[name=tipo]:checked").value=="Entrega";$("#end").hidden=!ent;$("#end").required=ent});
$("#checkout").onsubmit=e=>{e.preventDefault();if(!Object.keys(cart).length){toast("Carrinho vazio");return}
const f=new FormData(e.target);let t="*Pedido BRAVO*\n\n";
for(const[id,q]of Object.entries(cart)){const p=PRODUCTS.find(x=>x.id==id);if(p)t+=`${q}x ${p.name} – ${brl(p.price*q)}\n`}
t+=`\n*Total: ${brl(total())}*\n\nNome: ${f.get("nome")}\nTelefone: ${f.get("tel")}\n${f.get("tipo")=="Entrega"?"Entrega: "+f.get("end"):"Retirada no local"}\nPagamento: ${f.get("pag")}`;
if(f.get("obs"))t+=`\nObs.: ${f.get("obs")}`;
const isPix=f.get("pag")=="Pix", api=apiBase();
if(isPix&&api!==null){startPix(api,f,t);return}
sendOrder(t)};
function sendOrder(t){if(WHATSAPP_NUMBER){window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`,"_blank")}
else{$("#checkout").hidden=true;$("#pix").hidden=true;$("#summary").hidden=false;$("#sumText").value=t}}
function apiBase(){if(API_BASE)return API_BASE.replace(/\/$/,"");return /vercel\.app$/.test(location.hostname)||location.hostname=="localhost"?"":null}
let poll;
async function startPix(api,f,t){const btn=$("#checkout .go");btn.disabled=true;btn.textContent="Gerando Pix…";
try{const r=await fetch(api+"/api/criar-pix",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:Object.entries(cart).map(([id,qty])=>({id,qty})),cliente:{nome:f.get("nome"),tel:f.get("tel"),email:f.get("email")},idempotencyKey:(crypto.randomUUID?crypto.randomUUID():String(Date.now()))})});
const d=await r.json();if(!r.ok||!d.qr_code)throw new Error(d.error||"Falha ao gerar Pix");
$("#checkout").hidden=true;$("#pix").hidden=false;$("#pixAmount").textContent=brl(d.amount);$("#pixQr").src="data:image/png;base64,"+d.qr_code_base64;$("#pixCode").value=d.qr_code;
clearInterval(poll);poll=setInterval(async()=>{try{const s=await(await fetch(api+"/api/status?id="+d.id)).json();
if(s.status=="approved"){clearInterval(poll);$("#pixStatus").textContent="✅ Pagamento confirmado!";$("#pixStatus").classList.add("ok");
const paid="✅ *PAGO via Pix* (pagamento nº "+d.id+")\n"+t.replace(/\*Total: ([^*]+)\*/,"*Total: $1 — PAGO*");cart={};save();
setTimeout(()=>sendOrder(paid),1200)}
else if(s.status=="rejected"||s.status=="cancelled"){clearInterval(poll);$("#pixStatus").textContent="Pagamento não concluído ("+s.status+"). Tente novamente."}}catch(e){}},4000)}
catch(e){toast(e.message);}finally{btn.disabled=false;btn.textContent="Finalizar pedido"}}
$("#pixCopy").onclick=()=>{navigator.clipboard?.writeText($("#pixCode").value);toast("Código Pix copiado!")};
$("#copy").onclick=()=>{$("#sumText").select();navigator.clipboard?.writeText($("#sumText").value).catch(()=>document.execCommand("copy"));toast("Pedido copiado!")};
grid();render();
