/* Lista de produtos e preços — usada pela loja E pelo servidor (o servidor recalcula o total). */
// Preços de EXEMPLO — ajuste conforme a loja.
var PRODUCTS = [
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
if (typeof module !== 'undefined') module.exports = { PRODUCTS };
