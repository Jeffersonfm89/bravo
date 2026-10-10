localStorage.clear();setTimeout(async()=>{const q=s=>document.querySelector(s);q('[data-id=p-carne]').click();q('[data-id=p-carne]').click();q('[data-id=a-300]').click();
const f=q('#checkout');f.nome.value='Ana';f.tel.value='47999990000';f.end.value='Rua X, 10';f.requestSubmit();
const rev=q('#vReview').hidden+'|'+q('#reviewBox').innerText.replace(/\s+/g,' ');q('#confirm').click();
setTimeout(async()=>{const a=[q('#vPix').hidden,q('#pixAmount').textContent,q('.oid').textContent];await fetch('/__approve');
setTimeout(()=>{document.title='RES|'+rev+'|'+a.join('|')+'|'+q('#doneTitle').textContent+'|'+q('#vDone').hidden+'|'+q('#sumText').value.replace(/\n/g,' / ')},6000)},1500)},300)
