// Local integration checks. Creates isolated records and cleans up only those IDs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const origin='http://localhost:3010';
const base=origin+'/fotos';
const privateAccess=fs.readFileSync('.credentials/acesso-fotografo.txt','utf8');
const ownerEmail=privateAccess.match(/E-mail: (.+)/)[1];
const ownerPassword=privateAccess.match(/Senha: (.+)/)[1];
const run=crypto.randomUUID().replaceAll('-','');
const fixtures={clientId:null,secondClientId:null,orderId:null,galleries:[]};
const results=[];
let adminCookie='',clientCookie='';
const directory='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const databases=fs.readdirSync(directory).filter((name)=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
assert.equal(databases.length,1,'Expected a single local project database.');
const db=new DatabaseSync(path.join(directory,databases[0]));
db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
const originalSelections=JSON.stringify(db.prepare('SELECT * FROM selections ORDER BY id').all());
const originalClients=JSON.stringify(db.prepare('SELECT * FROM clients ORDER BY id').all());
const ownerId=db.prepare('SELECT id FROM photographers WHERE email=?').get(ownerEmail).id;
const originalSettings=db.prepare('SELECT * FROM account_settings WHERE owner_id=?').get(ownerId);
const cookieOf=(response)=>response.headers.getSetCookie().map((cookie)=>cookie.split(';')[0]).join('; ');
async function request(url,{method='GET',body,cookie=adminCookie,status=200,raw=false}={}){
 const headers={origin,...(cookie?{cookie}:{})};
 let payload=body;
 if(body!==undefined&&!(body instanceof FormData)){headers['content-type']='application/json';payload=JSON.stringify(body);}
 const response=await fetch(base+url,{method,headers,body:payload,redirect:'manual'});
 assert.equal(response.status,status,`${method} ${url}: ${response.status}, expected ${status}. ${response.status!==status?await response.text():''}`);
 if(raw)return response;
 return response.json();
}
const pass=(name)=>{results.push(name);console.log('PASS '+name);};
async function upload(gallery,bytes){
 const response=await fetch(`${base}/api/galleries/${gallery.id}/photos`,{method:'POST',headers:{origin,cookie:adminCookie,'content-type':'image/png','x-photo-filename':'prova.png','x-original-filename':encodeURIComponent('Foto Original.png')},body:new Blob([bytes],{type:'image/png'})});
 assert.equal(response.status,201,`Photo upload: ${response.status}, expected 201. ${response.status!==201?await response.text():''}`);
 return (await response.json()).photo;
}
try{
 await request('/api/photographer/login',{method:'POST',body:{email:ownerEmail,password:'invalid'},cookie:'',status:401});
 const signIn=await request('/api/photographer/login',{method:'POST',body:{email:ownerEmail,password:ownerPassword},cookie:'',raw:true});adminCookie=cookieOf(signIn);
 assert.ok(signIn.headers.get('set-cookie').includes('HttpOnly'));
 const forged=await fetch(base+'/api/clients',{headers:{'oai-authenticated-user-id':ownerId,'oai-authenticated-user-email':ownerEmail}});assert.equal(forged.status,401);
 const csrf=await fetch(base+'/api/clients',{method:'POST',headers:{cookie:adminCookie,origin:'https://evil.example','content-type':'application/json'},body:'{}'});assert.equal(csrf.status,403);
 pass('Photographer password login, HttpOnly session, forged identity and CSRF protection');
 await request('/api/clients',{cookie:'',status:401});await request('/api/orders',{cookie:'',status:401});await request('/api/deliveries',{cookie:'',status:401});
 await request('/api/client/login',{method:'POST',body:null,cookie:'',status:400});await request('/api/clients',{method:'POST',body:{name:'Invalid',email:'invalid'},status:400});
 pass('Private APIs and malformed input');
 const client=(await request('/api/clients',{method:'POST',status:201,body:{name:'Verificação '+run.slice(0,8),email:`verify-${run}@example.invalid`,phone:'11999990000'}})).client;fixtures.clientId=client.id;
 assert.ok((await request('/api/clients')).clients.some((item)=>item.id===client.id));
 const login='verify.'+run,password='Local-'+run;
 await request(`/api/clients/${client.id}/credentials`,{method:'PUT',body:{login,password}});
 pass('Client creation and credential persistence');
 const createGallery=async(type)=>{const gallery=(await request('/api/galleries',{method:'POST',status:201,body:{name:'Verificação '+type+' '+run.slice(0,8),clientIds:[client.id],projectType:type,deadline:'2099-12-31'}})).gallery;fixtures.galleries.push(gallery);return gallery;};
 const selection=await createGallery('selection');
 const bytes=fs.readFileSync('public/zutere-black.png');
 const photo=await upload(selection,bytes);
 await request(`/api/galleries/${selection.id}/photos`,{method:'PATCH',body:{photoId:photo.id}});
 const listed=await request(`/api/galleries/${selection.id}/photos`);assert.equal(listed.photos.length,1);assert.equal(listed.photos[0].isCover,true);assert.equal(listed.photos[0].filename,'Foto Original.png');
 await request(`/api/gallery/${selection.slug}/photos/${photo.id}`,{cookie:'',status:401});
 await request(`/gallery/${selection.slug}`,{cookie:'',raw:true,status:200});
 pass('Gallery creation, upload, cover and private images');
 await request('/api/client/login',{method:'POST',cookie:'',body:{slug:selection.slug,login,password:'wrong'},status:401});
 const portalLogin=await request('/api/client/login',{method:'POST',cookie:'',body:{login,password},raw:true});
 const portal=await request('/api/client/galleries',{cookie:cookieOf(portalLogin)});assert.ok(portal.galleries.some(item=>item.name===selection.name));
 pass('Client login without gallery link and private gallery portal');
 const signed=await request('/api/client/login',{method:'POST',cookie:'',body:{slug:selection.slug,login,password},raw:true});clientCookie=cookieOf(signed);
 assert.equal((await request(`/api/gallery/${selection.slug}/photos`,{cookie:clientCookie})).photos.length,1);
 const selectedEndpoint=`/api/gallery/${selection.slug}/selection`;
 await request(selectedEndpoint,{method:'PATCH',cookie:clientCookie,body:{photoIds:[photo.id]}});
 assert.deepEqual((await request(selectedEndpoint,{cookie:clientCookie})).photoIds,[photo.id]);
 await request(selectedEndpoint,{method:'PATCH',cookie:clientCookie,body:{photoIds:[]}});
 assert.deepEqual((await request(selectedEndpoint,{cookie:clientCookie})).photoIds,[]);
 await request(`/api/gallery/${selection.slug}/comments`,{method:'PUT',cookie:clientCookie,body:{photoId:photo.id,comment:'Teste de retoque na foto.'}});
 assert.equal((await request(`/api/gallery/${selection.slug}/comments`,{cookie:clientCookie})).comments[0].comment,'Teste de retoque na foto.');
 assert.deepEqual((await request(selectedEndpoint,{cookie:clientCookie})).photoIds,[],'A comment must not select a photo.');
 await request(selectedEndpoint,{method:'POST',cookie:clientCookie,body:{photoIds:[photo.id],message:'Seleção de teste finalizada.'}});
 assert.equal((await request(selectedEndpoint,{cookie:clientCookie})).completed,true);
 await request(selectedEndpoint,{method:'PATCH',cookie:clientCookie,body:{photoIds:[]},status:423});
 const ownerGallery=(await request('/api/galleries')).galleries.find((item)=>item.id===selection.id);assert.equal(ownerGallery.selectionCount,1);assert.equal(ownerGallery.selectedPhotos[0].comment,'Teste de retoque na foto.');assert.equal(ownerGallery.selectionMessage,'Seleção de teste finalizada.');
 await request(`/api/galleries/${selection.id}`,{method:'PATCH',body:{reopenSelection:true}});
 assert.equal((await request(selectedEndpoint,{cookie:clientCookie})).completed,false);
 await request(selectedEndpoint,{method:'PATCH',cookie:clientCookie,body:{photoIds:[]}});
 pass('Client sign-in, add/remove, comments, final submission and reopen');
 const second=(await request('/api/clients',{method:'POST',status:201,body:{name:'Segundo cliente '+run.slice(0,8),email:`verify-second-${run}@example.invalid`}})).client;fixtures.secondClientId=second.id;
 await request(`/api/clients/${second.id}/credentials`,{method:'PUT',body:{login:login+'.second',password}});
 await request(`/api/galleries/${selection.id}`,{method:'PATCH',body:{clientIds:[client.id,second.id]}});
 const secondSignIn=await request('/api/client/login',{method:'POST',cookie:'',body:{slug:selection.slug,login:login+'.second',password},raw:true});const secondCookie=cookieOf(secondSignIn);
 await request(selectedEndpoint,{method:'POST',cookie:clientCookie,body:{photoIds:[photo.id],message:'Primeiro cliente finalizado.'}});
 assert.equal((await request(selectedEndpoint,{cookie:secondCookie})).completed,false,'One client must not lock the other client.');
 assert.equal((await request('/api/galleries')).galleries.find((item)=>item.id===selection.id).status,'selecting');
 await request(selectedEndpoint,{method:'PATCH',cookie:secondCookie,body:{photoIds:[photo.id]}});
 assert.equal((await request('/api/galleries')).galleries.find((item)=>item.id===selection.id).selectionCount,1,'The same photo chosen by two clients is counted once.');
 await request(selectedEndpoint,{method:'POST',cookie:secondCookie,body:{photoIds:[photo.id],message:'Segundo cliente finalizado.'}});
 assert.equal((await request('/api/galleries')).galleries.find((item)=>item.id===selection.id).status,'completed');
 await request(`/api/galleries/${selection.id}`,{method:'PATCH',body:{reopenSelection:true}});
 assert.equal((await request(selectedEndpoint,{cookie:clientCookie})).completed,false);assert.equal((await request(selectedEndpoint,{cookie:secondCookie})).completed,false);
 pass('Independent submissions for multiple clients and unique photo counts');
 const order=(await request('/api/orders',{method:'POST',status:201,body:{clientId:client.id,description:'Pedido de verificação',amountCents:12345}})).order;fixtures.orderId=order.id;
 await request('/api/orders',{method:'PATCH',body:{id:order.id,status:'paid'}});
 assert.equal((await request('/api/orders')).orders.find((item)=>item.id===order.id).status,'paid');
 pass('Order creation, status update and persistence');
 const deliveryGallery=await createGallery('delivery');
 const original=bytes; const deliveryPhoto=await upload(deliveryGallery,original);
 const deliveryPath=`/api/gallery/${deliveryGallery.slug}/photos/${deliveryPhoto.id}?download=1`;
 await request(deliveryPath,{cookie:clientCookie,status:403});
 await request('/api/deliveries',{method:'POST',status:201,body:{galleryId:deliveryGallery.id,expiresAt:'2099-12-31'}});
 assert.equal((await request(`/api/gallery/${deliveryGallery.slug}/photos`,{cookie:clientCookie})).canDownload,true);
 const downloaded=await request(deliveryPath,{cookie:clientCookie,raw:true});assert.ok(downloaded.headers.get('content-disposition').startsWith('attachment;'));assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),original);
 assert.equal((await request('/api/deliveries')).deliveries.find((item)=>item.galleryId===deliveryGallery.id).downloadCount,1);
 db.prepare('UPDATE deliveries SET expires_at=? WHERE gallery_id=?').run(Date.now()-1000,deliveryGallery.id);
 await request(deliveryPath,{cookie:clientCookie,status:403});
 pass('Original delivery files, download release, accounting and expiry');
 const settings=(await request('/api/settings')).settings;
 for(const appearance of ['dark','system','light']){await request('/api/settings',{method:'PUT',body:{...settings,appearance}});assert.equal((await request('/api/settings')).settings.appearance,appearance);}
 await request('/api/settings',{method:'PUT',body:{...settings,appearance:settings.appearance}});
 pass('Settings save and all three appearance modes');
 for(const route of ['/','/clientes','/galerias','/pedidos','/entregas','/relatorios','/configuracoes',`/gallery/${selection.slug}`,`/cliente/${selection.slug}`])await request(route,{raw:true});
 await request('/api/gallery/does-not-exist/photos',{status:404});
 pass('All project pages and missing gallery handling');
 const extra=await upload(selection,bytes);await request(`/api/galleries/${selection.id}/photos`,{method:'DELETE',body:{photoId:extra.id}});assert.equal((await request(`/api/galleries/${selection.id}/photos`)).photos.length,1);
 pass('Adding and deleting photos in an existing gallery');
 const bytesBefore=db.prepare('SELECT bytes FROM photo_storage_usage WHERE id=1').get().bytes;
 const large=await fetch(base+'/api/galleries/'+selection.id+'/photos',{method:'POST',headers:{origin,cookie:adminCookie,'content-type':'image/png'},body:Buffer.alloc(1000001)});assert.equal(large.status,413);
 assert.equal(db.prepare('SELECT bytes FROM photo_storage_usage WHERE id=1').get().bytes,bytesBefore);
 db.prepare('UPDATE photo_storage_usage SET bytes=? WHERE id=1').run(367001600);
 try{assert.throws(()=>db.prepare('INSERT INTO photo_files (storage_key,content_type,size,data) VALUES (?,?,?,?)').run('quota-test','image/png',1,Buffer.from([1])));assert.equal(db.prepare('SELECT bytes FROM photo_storage_usage WHERE id=1').get().bytes,367001600);}finally{db.prepare('UPDATE photo_storage_usage SET bytes=? WHERE id=1').run(bytesBefore);}
 const oldCookie=adminCookie;await request('/api/logout',{method:'POST'});await request('/api/clients',{cookie:oldCookie,status:401});
 const again=await request('/api/photographer/login',{method:'POST',body:{email:ownerEmail,password:ownerPassword},cookie:'',raw:true});adminCookie=cookieOf(again);
 pass('Free storage size, atomic capacity limit and revoked logout sessions');
}finally{
 for(const gallery of fixtures.galleries){try{await request(`/api/galleries/${gallery.id}`,{method:'DELETE'});}catch(error){console.error('Cleanup failed for test gallery '+gallery.id,error.message);}}
 if(fixtures.orderId)db.prepare('DELETE FROM orders WHERE id=?').run(fixtures.orderId);
 if(fixtures.clientId)db.prepare('DELETE FROM clients WHERE id=?').run(fixtures.clientId);
 if(fixtures.secondClientId)db.prepare('DELETE FROM clients WHERE id=?').run(fixtures.secondClientId);
 if(originalSettings){db.prepare('UPDATE account_settings SET display_name=?,studio_name=?,login_email=?,primary_color=?,accent_color=?,appearance=?,plan=?,updated_at=? WHERE owner_id=?').run(originalSettings.display_name,originalSettings.studio_name,originalSettings.login_email,originalSettings.primary_color,originalSettings.accent_color,originalSettings.appearance,originalSettings.plan,originalSettings.updated_at,originalSettings.owner_id);}else db.prepare('DELETE FROM account_settings WHERE owner_id=?').run(ownerId);
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM selections ORDER BY id').all()),originalSelections,'Existing selections must be untouched.');
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM clients ORDER BY id').all()),originalClients,'Existing client records must be untouched.');
 db.close();
 fs.mkdirSync('outputs',{recursive:true});
 fs.writeFileSync('outputs/verification-local.json',JSON.stringify({at:new Date().toISOString(),passed:results,fixturesCleaned:true},null,2)+'\n');
 console.log('Test records cleaned up; existing clients, selections and settings preserved.');
}

