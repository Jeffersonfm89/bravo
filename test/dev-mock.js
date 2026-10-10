// Servidor local de teste: serve o site + /api com o Mercado Pago SIMULADO (fetch mockado).
process.env.MP_ACCESS_TOKEN='TEST-mock';
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const calls=[];let st='pending';
global.fetch=async(u,o={})=>{calls.push({u,method:o.method||'GET',headers:o.headers,body:o.body&&JSON.parse(o.body)});
 if(u.endsWith('/v1/payments')){const b=JSON.parse(o.body);return{ok:true,json:async()=>({id:123456,status:'pending',transaction_amount:b.transaction_amount,point_of_interaction:{transaction_data:{qr_code:'00020126PIXMOCK',qr_code_base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='}}})}}
 return{ok:true,json:async()=>({id:123456,status:st,transaction_amount:15,metadata:{}})}};
const root=path.join(__dirname,'..');
http.createServer(async(req,res)=>{const p=url.parse(req.url,true);
 if(p.pathname=='/__approve'){st='approved';return res.end('ok')}
 if(p.pathname=='/__calls'){return res.end(JSON.stringify(calls))}
 if(p.pathname.startsWith('/api/')){let b='';for await(const c of req)b+=c;req.body=b;req.query=p.query;
  res.status=c=>{res.statusCode=c;return res};res.json=d=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(d))};res.send=d=>res.end(d);
  return require(path.join(root,p.pathname+'.js'))(req,res)}
 const f=path.join(root,p.pathname=='/'?'index.html':p.pathname);fs.readFile(f,(e,d)=>{if(e){res.statusCode=404;return res.end()}res.end(d)})
}).listen(8766,()=>console.log('http://localhost:8766'));
