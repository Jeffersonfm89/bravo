localStorage.clear();setTimeout(async()=>{document.querySelector('[data-id=p-carne]').click();document.querySelector('[data-id=b-coca]').click();
const f=document.getElementById('checkout');f.nome.value='Ana';f.tel.value='11999';f.end.value='Rua X';f.requestSubmit();
setTimeout(async()=>{const a=[!document.getElementById('pix').hidden,document.getElementById('pixAmount').textContent,document.getElementById('pixCode').value];await fetch('/__approve');
setTimeout(()=>{document.title='RES|'+a.join('|')+'|'+document.getElementById('pixStatus').textContent+'|'+document.getElementById('sumText').value.replace(/\n/g,' / ')},6000)},1500)},300)
