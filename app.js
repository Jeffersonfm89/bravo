/* ====== CONFIGURAÇÃO (edite aqui) ====== */
// Configurações (WhatsApp, API, link) ficam em app-config.js
// Os produtos e preços ficam em products.js
/* ====================================== */
const $=s=>document.querySelector(s),brl=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
let cart=JSON.parse(localStorage.getItem("bravoCart")||"{}");let cat="all";
const save=()=>{localStorage.setItem("bravoCart",JSON.stringify(cart));render()};
function grid(){$("#grid").innerHTML=PRODUCTS.filter(p=>cat=="all"||p.cat==cat).map(p=>`<div class="card"><img src="${p.img}" alt="${p.name}" loading="lazy"><div class="b"><h3>${p.name}</h3><small>${p.desc}</small><div class="p">${brl(p.price)}</div><button class="add" data-id="${p.id}">Adicionar</button></div></div>`).join("")}
function total(){return Object.entries(cart).reduce((s,[id,q])=>s+(PRODUCTS.find(p=>p.id==id)?.price||0)*q,0)}
function render(){const n=Object.values(cart).reduce((a,b)=>a+b,0);$("#count").textContent=n;
$("#items").innerHTML=n?Object.entries(cart).map(([id,q])=>{const p=PRODUCTS.find(x=>x.id==id);if(!p)return"";return`<div class="it"><img src="${p.img}" alt=""><div class="n">${p.name}<br><b>${brl(p.price*q)}</b><br><button class="rm" data-rm="${id}">Remover</button></div><div class="q"><button data-dec="${id}">−</button><span>${q}</span><button data-inc="${id}">+</button></div></div>`}).join(""):"<p>Seu carrinho está vazio.</p>";
$("#total").textContent=brl(total());if(!n&&!$("#vReview").hidden)view("vCart")}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("s");setTimeout(()=>e.classList.remove("s"),1400)}
function openCart(o){$("#drawer").classList.toggle("open",o);$("#overlay").hidden=!o;if(o&&!$("#vDone").hidden&&Object.keys(cart).length)view("vCart")}
document.addEventListener("click",e=>{const d=e.target.dataset;
if(d.id){cart[d.id]=(cart[d.id]||0)+1;save();toast("Adicionado ao carrinho!")}
if(d.inc){cart[d.inc]++;save()} if(d.dec){if(--cart[d.dec]<=0)delete cart[d.dec];save()} if(d.rm){delete cart[d.rm];save()}
if(d.cat){cat=d.cat;document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b==e.target));grid()}});
$("#cartBtn").onclick=()=>openCart(true);$("#closeCart").onclick=$("#overlay").onclick=()=>openCart(false);
document.querySelectorAll("[name=tipo]").forEach(r=>r.onchange=()=>{const ent=$("[name=tipo]:checked").value=="Entrega";$("#end").hidden=!ent;$("#end").required=ent});
/* ---- Checkout: dados → revisão → confirmação ---- */
function view(v){["vCart","vReview","vPix","vDone"].forEach(x=>$("#"+x).hidden=x!=v);$("#dTitle").textContent={vCart:"Seu carrinho",vReview:"Revisão",vPix:"Pagamento",vDone:"Pedido"}[v]}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function breakdownHTML(o){return `<table class="bd">${o.itens.map(i=>`<tr><td>${i.qty}x ${esc(i.name)}<br><small>${brlFmt(i.unit)} cada</small></td><td class="n">${brlFmt(i.subtotal)}</td></tr>`).join("")}
<tr class="s"><td>Subtotal</td><td class="n">${brlFmt(o.subtotal)}</td></tr><tr class="s"><td>Taxa de entrega</td><td class="n">${feeLabel(o.taxaEntrega)}</td></tr>
<tr class="t"><td>Total</td><td class="n">${brlFmt(o.total)}${o.taxaEntrega==null?" + entrega":""}</td></tr></table>`}
function custHTML(c,pag){return `<div class="cust"><b>${esc(c.nome)}</b> · ${esc(c.tel)}<br>${c.tipo=="Retirada"?"Retirada no local":"Entrega: "+esc(c.end)}<br>Pagamento: ${esc(pag)}${c.obs?"<br>Obs.: "+esc(c.obs):""}</div>`}
const trackURL=id=>(SITE_URL||location.origin+location.pathname.replace(/[^/]*$/,""))+"pedido.html?id="+id;
let draft=null,poll;
$("#checkout").onsubmit=e=>{e.preventDefault();if(!Object.keys(cart).length){toast("Carrinho vazio");return}
const f=new FormData(e.target),cliente={nome:f.get("nome"),tel:f.get("tel"),email:f.get("email"),tipo:f.get("tipo"),end:f.get("tipo")=="Entrega"?f.get("end"):"",obs:f.get("obs")};
let br;try{br=buildBreakdown(Object.entries(cart).map(([id,qty])=>({id,qty})),cliente.tipo)}catch(err){toast(err.message);return}
draft={...br,cliente,pagamento:f.get("pag")};$("#reviewBox").innerHTML=breakdownHTML(draft)+custHTML(cliente,draft.pagamento);view("vReview")};
$("#back").onclick=()=>view("vCart");
$("#confirm").onclick=async()=>{const api=apiBase(),btn=$("#confirm");
if(api===null){showDone({...draft,id:""},false);return}
btn.disabled=true;btn.textContent="Enviando…";
try{const r=await fetch(api+"/api/pedido",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:draft.itens.map(i=>({id:i.id,qty:i.qty})),cliente:draft.cliente,pagamento:draft.pagamento})});
const o=await r.json();if(!r.ok)throw new Error(o.error||"Falha ao enviar pedido");
cart={};save();document.querySelectorAll(".oid").forEach(x=>x.textContent=o.id);document.querySelectorAll(".trackLink").forEach(a=>a.href=trackURL(o.id));
if(o.pixErro)toast("Pix automático indisponível: combine o Pix pelo WhatsApp");
if(o.pagamento=="Pix"&&o.pix){view("vPix");$("#pixAmount").textContent=brlFmt(o.total);$("#pixQr").src="data:image/png;base64,"+o.pix.qr_code_base64;$("#pixCode").value=o.pix.qr_code;$("#pixStatus").textContent="Aguardando pagamento…";$("#pixStatus").classList.remove("ok");
clearInterval(poll);poll=setInterval(async()=>{try{const s=await(await fetch(api+"/api/pedido?id="+o.id)).json();
if(s.pago){clearInterval(poll);$("#pixStatus").textContent="✅ Pagamento confirmado!";$("#pixStatus").classList.add("ok");setTimeout(()=>showDone(s,true),1200)}
else if(["rejected","cancelled","expired"].includes(s.pixStatus)){clearInterval(poll);$("#pixStatus").textContent="Pagamento não concluído ("+s.pixStatus+"). Faça um novo pedido."}}catch(e){}},4000)}
else showDone(o,false)}
catch(e){toast(e.message)}finally{btn.disabled=false;btn.textContent="Confirmar pedido"}};
function showDone(o,paid){const t=orderText(o,o.id?trackURL(o.id):"");view("vDone");$("#doneTitle").textContent=paid?"✅ Pagamento confirmado!":"✅ Pedido recebido!";$("#sumText").value=t;
document.querySelectorAll(".trackLink").forEach(a=>a.hidden=!o.id);
$("#sendWa").hidden=!WHATSAPP_NUMBER;$("#sendWa").onclick=()=>window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`,"_blank")}
function apiBase(){return API}
$("#pixCopy").onclick=()=>{navigator.clipboard?.writeText($("#pixCode").value);toast("Código Pix copiado!")};
$("#copy").onclick=()=>{$("#sumText").select();navigator.clipboard?.writeText($("#sumText").value).catch(()=>document.execCommand("copy"));toast("Pedido copiado!")};
grid();render();
