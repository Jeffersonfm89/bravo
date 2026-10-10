/* ====== CONFIGURAÇÃO (edite aqui) ====== */
// Número do WhatsApp da Bravo com DDI+DDD, só dígitos, ex.: "5511999998888". Vazio = mostra resumo para copiar.
const WHATSAPP_NUMBER = "";
// Preços de EXEMPLO — ajuste conforme a loja.
const PRODUCTS = [
  {id:"p-carne",cat:"Pastéis",name:"Pastel de Carne",desc:"Carne moída temperada",price:9.00,img:"img/pastel.jpg"},
  {id:"p-carneq",cat:"Pastéis",name:"Pastel de Carne com Queijo",desc:"Carne moída e muçarela",price:11.00,img:"img/pastel.jpg"},
  {id:"p-frango",cat:"Pastéis",name:"Pastel de Frango com Catupiry",desc:"Frango desfiado e Catupiry",price:11.00,img:"img/pastel.jpg"},
  {id:"p-queijo",cat:"Pastéis",name:"Pastel de Queijo",desc:"Muçarela derretida",price:9.00,img:"img/pastel.jpg"},
  {id:"p-pizza",cat:"Pastéis",name:"Pastel de Pizza",desc:"Muçarela, presunto, tomate e orégano",price:10.00,img:"img/pastel.jpg"},
  {id:"p-calab",cat:"Pastéis",name:"Pastel de Calabresa",desc:"Calabresa com queijo",price:10.00,img:"img/pastel.jpg"},
  {id:"p-palmito",cat:"Pastéis",name:"Pastel de Palmito",desc:"Palmito com queijo",price:11.00,img:"img/pastel.jpg"},
  {id:"p-choc",cat:"Pastéis",name:"Pastel de Chocolate",desc:"Doce, com chocolate ao leite",price:10.00,img:"img/pastel.jpg"},
  {id:"a-300",cat:"Açaí",name:"Açaí no Copo 300ml",desc:"Com granola, banana e leite condensado",price:15.00,img:"img/acai.jpg"},
  {id:"a-500",cat:"Açaí",name:"Açaí no Copo 500ml",desc:"Com granola, banana e leite condensado",price:22.00,img:"img/acai.jpg"},
  {id:"b-coca",cat:"Bebidas",name:"Coca-Cola Lata 350ml",desc:"Gelada",price:6.00,img:"img/coca.jpg"},
];
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
function openCart(o){$("#drawer").classList.toggle("open",o);$("#overlay").hidden=!o;if(o){$("#checkout").hidden=false;$("#summary").hidden=true}}
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
if(WHATSAPP_NUMBER){window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`,"_blank")}
else{$("#checkout").hidden=true;$("#summary").hidden=false;$("#sumText").value=t}};
$("#copy").onclick=()=>{$("#sumText").select();navigator.clipboard?.writeText($("#sumText").value).catch(()=>document.execCommand("copy"));toast("Pedido copiado!")};
grid();render();
