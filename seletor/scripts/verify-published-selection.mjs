import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const origin=process.argv[2];assert.equal(origin,'https://www.zutere.com.br');
const access=fs.readFileSync('.credentials/acesso-fotografo.txt','utf8');
const email=access.match(/E-mail: (.+)/)[1],password=access.match(/Senha: (.+)/)[1];
const run=crypto.randomUUID();let client, gallery, ownerCookie='',clientCookie='';
const cookieOf=response=>response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
async function request(path,{method='GET',body,cookie=ownerCookie,status=200,raw=false}={}){const response=await fetch(origin+'/fotos'+path,{method,headers:{origin,cookie,...(body!==undefined?{'content-type':'application/json'}:{})},body:body!==undefined?JSON.stringify(body):undefined});assert.equal(response.status,status,path);return raw?response:response.json();}
try{
 ownerCookie=cookieOf(await request('/api/photographer/login',{method:'POST',body:{email,password},cookie:'',raw:true}));
 client=(await request('/api/clients',{method:'POST',status:201,body:{name:'Verificação temporária',email:`test-${run}@example.invalid`}})).client;
 const login='test-'+run,testPassword=crypto.randomUUID();await request(`/api/clients/${client.id}/credentials`,{method:'PUT',body:{login,password:testPassword}});
 gallery=(await request('/api/galleries',{method:'POST',status:201,body:{name:'Verificação temporária',clientIds:[client.id],projectType:'selection',deadline:'2099-12-31'}})).gallery;
 const bytes=fs.readFileSync('public/zutere-black.png');const upload=await fetch(origin+`/fotos/api/galleries/${gallery.id}/photos`,{method:'POST',headers:{origin,cookie:ownerCookie,'content-type':'image/png','x-photo-filename':'teste.png'},body:bytes});assert.equal(upload.status,201);const {photo}=await upload.json();
 const photoPath=`/api/gallery/${gallery.slug}/photos/${photo.id}`;await request(photoPath,{cookie:'',status:401});
 clientCookie=cookieOf(await request('/api/client/login',{method:'POST',cookie:'',raw:true,body:{login,password:testPassword}}));
 const stored=await request(photoPath,{cookie:clientCookie,raw:true});assert.ok(stored.headers.get('content-type').startsWith('image/png'));assert.deepEqual(Buffer.from(await stored.arrayBuffer()),bytes);
 await request(`/api/gallery/${gallery.slug}/selection`,{method:'POST',cookie:clientCookie,body:{photoIds:[photo.id],message:'Verificação concluída'}});
 const result=(await request('/api/galleries')).galleries.find(item=>item.id===gallery.id);assert.equal(result.selectionCount,1);assert.equal(result.status,'completed');
 console.log('PASS domínio final: criação, upload D1, imagem privada, login do cliente, seleção e painel do fotógrafo');
}finally{
 if(gallery)await request(`/api/galleries/${gallery.id}`,{method:'DELETE'});
 if(client){assert.match(client.id,/^[a-f0-9-]{36}$/);const sql=`DELETE FROM clients WHERE id = '${client.id}';`;const child=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--command',sql],{stdio:'pipe'});assert.equal(child.status,0,'Limpeza do cliente de teste');}
 if(ownerCookie)await request('/api/logout',{method:'POST'});if(clientCookie)await request('/api/logout',{method:'POST',cookie:clientCookie});
 console.log('PASS registros temporários removidos e sessões encerradas');
}
