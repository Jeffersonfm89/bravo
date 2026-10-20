/* ====== CONFIGURAÇÃO (edite aqui) ====== */
// Configurações (WhatsApp, API, link) ficam em app-config.js
// Os produtos e preços ficam em products.js
/* ====================================== */
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
const $=s=>document.querySelector(s),brl=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
localStorage.removeItem("bravoCart");
let cart=JSON.parse(localStorage.getItem("bravoCart2")||"{}");let cat="all";
// limpa itens que não existem mais no cardápio
function cleanCart(full){for(const k in cart){const p=PRODUCTS.find(p=>p.id==cart[k].id);if(!p&&!full)continue;try{if(!p||p.ativo===false)throw 0;priceItem(p,cart[k].opts,cart[k].nota)}catch(e){delete cart[k]}}}cleanCart(false);
const save=()=>{localStorage.setItem("bravoCart2",JSON.stringify(cart));render()};
const fromPrice=p=>p.price+(p.options||[]).reduce((s,g)=>s+(g.min?g.choices.map(c=>c.price).sort((a,b)=>a-b).slice(0,g.min).reduce((a,b)=>a+b,0):0),0);
function grid(){$("#grid").innerHTML=PRODUCTS.filter(p=>p.ativo!==false&&(cat=="all"||p.cat==cat)).map(p=>`<div class="card"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"><div class="b"><h3>${esc(p.name)}</h3>${p.cat=="Hambúrgueres"?"":`<small>${esc(p.desc||"")}</small>`}<div class="p">${p.options?"a partir de ":""}${brl(fromPrice(p))}</div><button class="add" data-id="${p.id}">${p.options?"Escolher":"Adicionar"}</button></div></div>`).join("")}
function lines(){return Object.entries(cart).filter(([k,c])=>PRODUCTS.some(x=>x.id==c.id)).map(([k,c])=>{const p=PRODUCTS.find(x=>x.id==c.id),pr=priceItem(p,c.opts,c.nota);return{k,p,qty:c.qty,...pr}})}
function total(){return lines().reduce((s,l)=>s+l.unit*l.qty,0)}
function addToCart(id,opts,nota){const pr=priceItem(PRODUCTS.find(p=>p.id==id),opts,nota),k=id+"|"+JSON.stringify(pr.opts)+"|"+(pr.nota||"");cart[k]=cart[k]||{id,opts:pr.opts,nota:pr.nota||"",qty:0};cart[k].qty++;save();toast("Adicionado ao carrinho!")}
function render(){const L=lines(),n=L.reduce((a,l)=>a+l.qty,0);$("#count").textContent=n;
$("#items").innerHTML=n?L.map(l=>`<div class="it"><img src="${esc(l.p.img)}" alt=""><div class="n">${esc(l.p.name)}${l.detalhe?`<br><small class="det">${esc(l.detalhe)}</small>`:""}<br><b>${brl(l.unit*l.qty)}</b><br><button class="rm" data-rm="${esc(l.k)}">Remover</button></div><div class="q"><button data-dec="${esc(l.k)}">−</button><span>${l.qty}</span><button data-inc="${esc(l.k)}">+</button></div></div>`).join(""):"<p>Seu carrinho está vazio.</p>";
$("#total").textContent=brl(total());if(!n&&!$("#vReview").hidden)view("vCart")}
/* ---- Modal de opções ---- */
let mp=null;
function openOpts(p){mp=p;$("#mTitle").textContent=p.name;$("#mDesc").textContent=p.desc||"";
$("#mBody").innerHTML=p.options.map(g=>`<fieldset><legend>${g.label}${g.type=="single"?" (escolha 1)":g.min?` (mín. ${g.min}, máx. ${g.max})`:" (opcional)"}</legend>${g.choices.map((c,i)=>`<label class="opt"><input type="${g.type=="single"?"radio":"checkbox"}" name="g_${g.id}" value="${c.id}" ${g.type=="single"&&i==0?"checked":""}> <span>${c.name}</span><b>${c.price?(g.type=="single"&&!p.price?"":"+ ")+brl(c.price):""}</b></label>`).join("")}</fieldset>`).join("")+(p.nota?`<fieldset><legend>Outra observação</legend><input id="mNota" maxlength="100" placeholder="Ex.: bem passado, cortar ao meio" style="width:100%"></fieldset>`:"");
updOpts();$("#optModal").hidden=false}
function readOpts(){const o={};mp.options.forEach(g=>o[g.id]=[...document.querySelectorAll(`[name=g_${g.id}]:checked`)].map(x=>x.value));return o}
function updOpts(){try{const pr=priceItem(mp,readOpts(),$("#mNota")?.value);$("#mAdd").disabled=false;$("#mAdd").textContent="Adicionar · "+brl(pr.unit)}catch(e){$("#mAdd").disabled=true;$("#mAdd").textContent=e.message}}
$("#mBody").oninput=e=>{if(e.target.id=="mNota")updOpts()};$("#mBody").onchange=e=>{const g=mp.options.find(g=>"g_"+g.id==e.target.name);if(g&&g.type=="multi"&&e.target.checked&&readOpts()[g.id].length>g.max){e.target.checked=false;toast("Máximo de "+g.max)}updOpts()};
$("#mAdd").onclick=()=>{addToCart(mp.id,readOpts(),$("#mNota")?.value);$("#optModal").hidden=true};$("#mClose").onclick=()=>$("#optModal").hidden=true;
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("s");setTimeout(()=>e.classList.remove("s"),1400)}
function openCart(o){$("#drawer").classList.toggle("open",o);$("#overlay").hidden=!o;if(o&&!$("#vDone").hidden&&Object.keys(cart).length)view("vCart")}
document.addEventListener("click",e=>{const d=e.target.dataset;
if(d.id){const p=PRODUCTS.find(x=>x.id==d.id);p.options?openOpts(p):addToCart(p.id,{})}
if(d.inc){cart[d.inc].qty++;save()} if(d.dec){if(--cart[d.dec].qty<=0)delete cart[d.dec];save()} if(d.rm){delete cart[d.rm];save()}
if(d.cat){cat=d.cat;document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b==e.target));grid()}});
$("#cartBtn").onclick=()=>openCart(true);$("#closeCart").onclick=$("#overlay").onclick=()=>openCart(false);
document.querySelectorAll("[name=tipo]").forEach(r=>r.onchange=()=>{const ent=$("[name=tipo]:checked").value=="Entrega";$("#addr").hidden=!ent;if(window.meApplyTipo)meApplyTipo();else $("#addr").querySelectorAll("[required],[data-req]").forEach(i=>{i.dataset.req=1;i.required=ent})});
/* ---- Bairros e taxas (do servidor) ---- */
let BAIRROS=[];const feeOf=n=>{const b=BAIRROS.find(x=>x.nome==n);return b?b.taxa:undefined};
async function loadBairros(){try{if(API===null)throw 0;const d=await(await fetch(API+"/api/config")).json();BAIRROS=d.bairros||[];if(d.pastelAdds){applyAddPrices(d.pastelAdds);grid();render()}}catch(e){BAIRROS=DEFAULT_BAIRROS.map(nome=>({nome,taxa:null}))}
$("#bairro").innerHTML='<option value="">Selecione o bairro</option>'+BAIRROS.map(b=>`<option value="${esc(b.nome)}">${esc(b.nome)} — ${b.taxa==null?"taxa a combinar":"entrega "+brl(b.taxa)}</option>`).join("")}
$("#bairro").onchange=()=>{const f=feeOf($("#bairro").value);$("#feeInfo").textContent=f===undefined?"":"Taxa de entrega: "+feeLabel(f)};loadBairros();
/* ---- Checkout: dados → revisão → confirmação ---- */
function view(v){["vCart","vReview","vPix","vDone"].forEach(x=>$("#"+x).hidden=x!=v);$("#dTitle").textContent={vCart:"Seu carrinho",vReview:"Revisão",vPix:"Pagamento",vDone:"Pedido"}[v]}
function breakdownHTML(o){return `<table class="bd">${o.itens.map(i=>`<tr><td>${i.qty}x ${esc(i.name)}${i.detalhe?`<br><small class="det">${esc(i.detalhe)}</small>`:""}<br><small>${brlFmt(i.unit)} cada</small></td><td class="n">${brlFmt(i.subtotal)}</td></tr>`).join("")}
<tr class="s"><td>Subtotal</td><td class="n">${brlFmt(o.subtotal)}</td></tr><tr class="s"><td>Taxa de entrega</td><td class="n">${feeLabel(o.taxaEntrega)}</td></tr>
<tr class="t"><td>Total</td><td class="n">${brlFmt(o.total)}${o.taxaEntrega==null?" + entrega":""}</td></tr></table>`}
function custHTML(c,pag){return `<div class="cust"><b>${esc(c.nome)}</b> · ${esc(c.tel)}<br>${c.tipo=="Retirada"?"Retirada no local":"Entrega: "+esc(c.end)}<br>Pagamento: ${esc(pag)}${c.obs?"<br>Obs.: "+esc(c.obs):""}</div>`}
const trackURL=id=>(SITE_URL||location.origin+location.pathname.replace(/[^/]*$/,""))+"pedido.html?id="+id;
let draft=null,poll;
$("#checkout").onsubmit=e=>{e.preventDefault();if(!Object.keys(cart).length){toast("Carrinho vazio");return}
const f=new FormData(e.target),ent=f.get("tipo")=="Entrega",cliente={nome:f.get("nome"),tel:f.get("tel"),email:f.get("email"),tipo:f.get("tipo"),obs:f.get("obs")};
if(ent&&window.meRef){Object.assign(cliente,{bairro:meRef.bairro,addressRef:meRef.addressRef,end:meRef.masked+", Joinville"})}
else if(ent){Object.assign(cliente,{bairro:f.get("bairro"),rua:f.get("rua"),numero:f.get("numero"),complemento:f.get("complemento"),referencia:f.get("referencia")});
cliente.end=`${cliente.rua}, ${cliente.numero}${cliente.complemento?" - "+cliente.complemento:""} - ${cliente.bairro}, Joinville${cliente.referencia?" (Ref.: "+cliente.referencia+")":""}`}
let br;try{br=buildBreakdown(Object.values(cart).map(c=>({id:c.id,qty:c.qty,opts:c.opts,nota:c.nota})),cliente.tipo,ent?feeOf(cliente.bairro)??null:0)}catch(err){toast(err.message);return}
draft={...br,cliente,pagamento:f.get("pag")};$("#reviewBox").innerHTML=breakdownHTML(draft)+custHTML(cliente,draft.pagamento);view("vReview")};
$("#back").onclick=()=>view("vCart");
$("#confirm").onclick=async()=>{const api=apiBase(),btn=$("#confirm");
if(api===null){showDone({...draft,id:""},false);return}
btn.disabled=true;btn.textContent="Enviando…";
try{const r=await fetch(api+"/api/pedido",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:draft.itens.map(i=>({id:i.id,qty:i.qty,opts:i.opts,nota:i.nota})),cliente:draft.cliente,pagamento:draft.pagamento})});
const o=await r.json();if(!r.ok)throw new Error(o.error||"Falha ao enviar pedido");
cart={};save();localStorage.setItem("bravoLastOrder",o.id);try{window.meSave&&meSave(draft.cliente)}catch(_){}document.querySelectorAll(".oid").forEach(x=>x.textContent=o.id);document.querySelectorAll(".trackLink").forEach(a=>a.href=trackURL(o.id));
if(o.pixErro)toast("Pix automático indisponível: combine o Pix pelo WhatsApp");
if(o.pagamento=="Pix"&&o.pix){view("vPix");$("#pixAmount").textContent=brlFmt(o.total);$("#pixQr").src="data:image/png;base64,"+o.pix.qr_code_base64;$("#pixCode").value=o.pix.qr_code;$("#pixStatus").textContent="Aguardando pagamento…";$("#pixStatus").classList.remove("ok");
clearInterval(poll);const pixT0=Date.now();poll=setInterval(async()=>{if($("#vPix").hidden||Date.now()-pixT0>30*60e3){clearInterval(poll);return}if(document.hidden||!$("#drawer").classList.contains("open"))return;try{const s=await(await fetch(api+"/api/pedido?id="+o.id)).json();
if(s.pago){clearInterval(poll);$("#pixStatus").textContent="✅ Pagamento confirmado!";$("#pixStatus").classList.add("ok");setTimeout(()=>showDone(s,true),1200)}
else if(["rejected","cancelled","expired"].includes(s.pixStatus)){clearInterval(poll);$("#pixStatus").textContent="Pagamento não concluído ("+s.pixStatus+"). Faça um novo pedido."}}catch(e){}},5000)}
else showDone(o,false)}
catch(e){if(/^Endere\u00e7o salvo n\u00e3o encontrado|^Endereço salvo não encontrado/.test(e.message)&&window.meRefFail){meRefFail(draft.cliente);view("vCart");toast("Confirme rua e número para continuar")}else toast(e.message)}finally{btn.disabled=false;btn.textContent="Confirmar pedido"}};
function showDone(o,paid){const t=orderText(o,o.id?trackURL(o.id):"");view("vDone");$("#doneTitle").textContent=paid?"✅ Pagamento confirmado!":"✅ Pedido recebido!";$("#sumText").value=t;
document.querySelectorAll(".trackLink").forEach(a=>a.hidden=!o.id);
$("#sendWa").hidden=!WHATSAPP_NUMBER;$("#sendWa").onclick=()=>window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`,"_blank")}
function apiBase(){return API}
$("#pixCopy").onclick=()=>{navigator.clipboard?.writeText($("#pixCode").value);toast("Código Pix copiado!")};
$("#copy").onclick=()=>{$("#sumText").select();navigator.clipboard?.writeText($("#sumText").value).catch(()=>document.execCommand("copy"));toast("Pedido copiado!")};
function tabs(){const cs=[...new Set(PRODUCTS.filter(p=>p.ativo!==false).map(p=>p.cat))].sort((a,b)=>{const o=CATS_ORDER,i=o.indexOf(a),j=o.indexOf(b);return(i<0?99:i)-(j<0?99:j)});if(cat!="all"&&!cs.includes(cat))cat="all";
const t=document.querySelector(".tabs");if(t)t.innerHTML=`<button data-cat="all" class="${cat=="all"?"on":""}">Tudo</button>`+cs.map(c=>`<button data-cat="${esc(c)}" class="${cat==c?"on":""}">${esc(c)}</button>`).join("")}
/* cardápio vem do servidor (editado no painel); se falhar, usa o padrão de products.js */
async function loadMenu(){try{if(API===null)throw 0;const r=await fetch(API+"/api/menu");if(!r.ok)throw 0;const d=await r.json();setProducts(d.products)}catch(e){}cleanCart(true);localStorage.setItem("bravoCart2",JSON.stringify(cart));tabs();grid();render()}
tabs();grid();render();loadMenu();

(function(){var b=document.getElementById("promoGo");if(b)b.onclick=function(){if(!PRODUCTS.some(function(p){return p.id=="a-garrafa"&&p.ativo!==false}))return;addToCart("a-garrafa");if(typeof openCart=="function")openCart(true);}})();
