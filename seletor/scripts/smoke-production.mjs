import fs from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.argv[2];assert.ok(origin?.startsWith('https://'));
const credential=fs.readFileSync('.credentials/acesso-fotografo.txt','utf8');
const email=credential.match(/E-mail: (.+)/)[1],password=credential.match(/Senha: (.+)/)[1];
for(const path of ['/fotos','/fotos/fotografo','/fotos/zutere-black.png','/fotos/api/clients']){const response=await fetch(origin+path);assert.equal(response.status,path.endsWith('/api/clients')?401:200,path);console.log('PASS '+path+' '+response.status);if(path==='/fotos')assert.ok((await response.text()).includes('Suas memórias estão aqui.'));if(path.endsWith('.png'))assert.ok(response.headers.get('content-type')?.startsWith('image/png'),'Logo must be an image, not an HTML fallback');}
const login=await fetch(origin+'/fotos/api/photographer/login',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email,password})});assert.equal(login.status,200,await login.text());
const cookie=login.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');assert.ok(cookie.includes('zutere_photographer='));
for(const path of ['/fotos/fotografo/painel','/fotos/api/clients','/fotos/api/storage']){const response=await fetch(origin+path,{headers:{cookie}});assert.equal(response.status,200,path);console.log('PASS authenticated '+path);}
const logout=await fetch(origin+'/fotos/api/logout',{method:'POST',headers:{origin,cookie}});assert.equal(logout.status,200);assert.equal((await fetch(origin+'/fotos/api/clients',{headers:{cookie}})).status,401);console.log('PASS production login, secure session and logout');
