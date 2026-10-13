import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto';
const origin=process.env.VERIFY_ORIGIN??'http://localhost:3010',base=origin+'/fotos';
const directory='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const file=fs.readdirSync(directory).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');const db=new DatabaseSync(path.join(directory,file));
db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
const id=randomUUID(),otherId=randomUUID(),run=randomUUID(),email=`account-${run}@example.invalid`,nextEmail=`changed-${run}@example.invalid`,duplicateEmail=`duplicate-${run}@example.invalid`;
const password=randomBytes(24).toString('base64url'),newPassword=randomBytes(24).toString('base64url');
function create(id,email){const salt=randomBytes(16).toString('base64url');db.prepare('INSERT INTO photographers (id,email,name,password_hash,salt,created_at) VALUES (?,?,?,?,?,?)').run(id,email,'Teste de conta',pbkdf2Sync(password,salt,100000,32,'sha256').toString('base64url'),salt,Date.now());}
let cookie='';
async function request(url,{method='GET',body,status=200,session=cookie,requestOrigin=origin}={}){const response=await fetch(base+url,{method,headers:{origin:requestOrigin,cookie:session,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(response.status,status,`${url} ${await response.clone().text()}`);return response;}
const cookieOf=response=>response.headers.getSetCookie().map(item=>item.split(';')[0]).join('; ');
try{
 create(id,email);create(otherId,duplicateEmail);
 const endpoint='/api/photographer/credentials';const initial={email:nextEmail,currentPassword:password,newPassword:'',confirmPassword:''};
 await request(endpoint,{method:'PUT',body:initial,status:401});
 cookie=cookieOf(await request('/api/photographer/login',{method:'POST',body:{email,password}}));
 const settings=await (await request('/api/settings')).json();assert.equal(settings.settings.authenticationEmail,email);
 await request(endpoint,{method:'PUT',body:initial,requestOrigin:'https://evil.example',status:403});
 await request(endpoint,{method:'PUT',body:{...initial,currentPassword:'wrong'},status:403});
 await request(endpoint,{method:'PUT',body:{...initial,email:duplicateEmail},status:409});
 await request(endpoint,{method:'PUT',body:{...initial,newPassword:'short',confirmPassword:'short'},status:400});
 await request(endpoint,{method:'PUT',body:{...initial,newPassword,confirmPassword:'different'},status:400});
 assert.equal(db.prepare('SELECT email FROM photographers WHERE id=?').get(id).email,email);
 const hashBefore=db.prepare('SELECT password_hash FROM photographers WHERE id=?').get(id).password_hash;
 const change=await request(endpoint,{method:'PUT',body:initial});assert.ok(change.headers.get('set-cookie').includes('Max-Age=0'));
 assert.equal(db.prepare('SELECT password_hash FROM photographers WHERE id=?').get(id).password_hash,hashBefore);
 await request('/api/clients',{status:401});await request('/api/photographer/login',{method:'POST',body:{email,password},status:401,session:''});
 cookie=cookieOf(await request('/api/photographer/login',{method:'POST',body:{email:nextEmail,password},session:''}));
 const secondSession=cookieOf(await request('/api/photographer/login',{method:'POST',body:{email:nextEmail,password},session:''}));
 await request(endpoint,{method:'PUT',body:{email:nextEmail,currentPassword:password,newPassword,confirmPassword:newPassword}});
 await request('/api/clients',{session:cookie,status:401});await request('/api/clients',{session:secondSession,status:401});
 await request('/api/photographer/login',{method:'POST',body:{email:nextEmail,password},session:'',status:401});
 cookie=cookieOf(await request('/api/photographer/login',{method:'POST',body:{email:nextEmail,password:newPassword},session:''}));
 await request('/api/clients');assert.equal(db.prepare('SELECT id FROM photographers WHERE email=?').get(nextEmail).id,id);
 console.log('PASS senha atual, validação, e-mail único, troca só de login, troca só de senha, novo acesso e revogação de todas as sessões');
}finally{db.prepare('DELETE FROM photographers WHERE id IN (?,?)').run(id,otherId);db.close();console.log('PASS contas de teste removidas; acesso real preservado');}

