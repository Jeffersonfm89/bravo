localStorage.clear();setTimeout(async()=>{const q=s=>document.querySelector(s),R=[];
q('[data-id=b-coca-2l]').click();const f=q('#checkout');f.nome.value='Bia';f.tel.value='47988887777';f.bairro.value='Centro';f.bairro.dispatchEvent(new Event('change'));R.push(q('#feeInfo').textContent);
f.rua.value='Rua B';f.numero.value='5';f.pag.value='Dinheiro na entrega';f.requestSubmit();R.push(q('#reviewBox').innerText.replace(/\s+/g,' '));q('#confirm').click();
setTimeout(()=>{R.push(q('#sumText').value.replace(/\n/g,' / '));document.title='RES|'+R.join(' ## ')},1500)},800)
