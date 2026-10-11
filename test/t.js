localStorage.clear();setTimeout(async()=>{const q=s=>document.querySelector(s),R=[];
q('[data-id=a-copo]').click();R.push(q('#mAdd').textContent);q('[name=g_tam][value="500"]').click();q('[name=g_add][value=mm]').click();q('[name=g_add][value=ninho]').click();q('#mBody').dispatchEvent(new Event('change'));R.push(q('#mAdd').textContent);q('#mAdd').click();
q('[data-id=p-personalizado]').click();R.push(q('#mAdd').textContent);q('[name=g_ing][value=bacon]').click();q('[name=g_ing][value=milho]').click();q('#mBody').dispatchEvent(new Event('change'));q('#mAdd').click();
q('[data-id=b-coca-2l]').click();q('[data-id=b-coca-2l]').click();
R.push(q('#items').innerText.replace(/\s+/g,' '));
const f=q('#checkout');f.nome.value='Ana';f.tel.value='47999990000';f.end.value='Rua X';f.pag.value='Dinheiro na entrega';f.requestSubmit();
R.push(q('#reviewBox').innerText.replace(/\s+/g,' '));q('#confirm').click();
setTimeout(()=>{R.push(q('#sumText').value.replace(/\n/g,' / '));document.title='RES|'+R.join(' ## ')},1500)},300)
