import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import ts from 'typescript';
const directory=path.resolve('outputs/drive-unit');fs.mkdirSync(directory,{recursive:true});
const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON; CREATE TABLE photographers(id TEXT PRIMARY KEY); CREATE TABLE galleries(id TEXT PRIMARY KEY); INSERT INTO photographers VALUES (\'owner\'); INSERT INTO galleries VALUES (\'gallery\');');
db.exec(fs.readFileSync('drizzle/0009_free_photo_storage.sql','utf8'));db.exec(fs.readFileSync('drizzle/0010_google_drive.sql','utf8'));
const adapter={prepare(sql){return {bind(...values){const stmt=db.prepare(sql);return {async first(){return stmt.get(...values)??null;},async all(){return {results:stmt.all(...values)};},async run(){return stmt.run(...values);},stmt,values};}};},async batch(items){db.exec('BEGIN');try{const result=items.map(item=>item.stmt.run(...item.values));db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}};
globalThis.driveTestEnv={DB:adapter,DRIVE_ENCRYPTION_KEY:randomBytes(32).toString('base64')};
fs.writeFileSync(path.join(directory,'env.mjs'),'export const env=globalThis.driveTestEnv;');
for(const name of ['drive-crypto','google-drive','photo-storage']){let source=fs.readFileSync('lib/'+name+'.ts','utf8');source=source.replaceAll("'cloudflare:workers'","'./env.mjs'").replaceAll("'./drive-crypto'","'./drive-crypto.mjs'").replaceAll("'./google-drive'","'./google-drive.mjs'");fs.writeFileSync(path.join(directory,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);}
const {seal,unseal}=await import(pathToFileURL(path.join(directory,'drive-crypto.mjs')).href);const {putDriveFile,getDriveStatus,driveToken}=await import(pathToFileURL(path.join(directory,'google-drive.mjs')).href);const {FILES}=await import(pathToFileURL(path.join(directory,'photo-storage.mjs')).href);
const key=globalThis.driveTestEnv.DRIVE_ENCRYPTION_KEY;const clientSecret='mock-client-secret',refresh='mock-refresh-token';
const cipher=await seal(clientSecret,key,'client:owner');assert.ok(!cipher.includes(clientSecret));assert.equal(await unseal(cipher,key,'client:owner'),clientSecret);await assert.rejects(()=>unseal(cipher,key,'client:another-owner'));
db.prepare('INSERT INTO drive_configs VALUES (?,?,?,?)').run('owner','test.apps.googleusercontent.com',cipher,Date.now());
db.prepare('INSERT INTO drive_connections VALUES (?,?,?,?,?,?)').run('owner','google-subject','test@example.invalid','root-folder',await seal(JSON.stringify({refreshToken:refresh,accessToken:'old-token',expiresAt:0}),key,'tokens:owner'),Date.now());
const originalFetch=globalThis.fetch;const files=new Map();let count=0,refreshes=0,trashed=0,uploadFailure=false;
globalThis.fetch=async(url,init={})=>{
 if(url==='https://oauth2.googleapis.com/token'){refreshes++;assert.equal(init.body.get('refresh_token'),refresh);return Response.json({access_token:'fresh-token',expires_in:3600});}
 assert.equal(new Headers(init.headers).get('Authorization'),'Bearer fresh-token');
 if(url.includes('/upload/drive/v3/files?uploadType=resumable'))return new Response(null,{status:200,headers:{Location:'https://www.googleapis.com/upload/drive/v3/files?upload_id=mock'}});
 if(url.includes('upload_id=mock')){if(uploadFailure)return new Response(null,{status:503});const bytes=Buffer.from(await new Response(init.body).arrayBuffer());const id='file-'+(++count);files.set(id,bytes);return Response.json({id});}
 if(init.method==='POST'){const payload=JSON.parse(init.body);assert.equal(payload.mimeType,'application/vnd.google-apps.folder');assert.deepEqual(payload.parents,['root-folder']);return Response.json({id:'gallery-folder'});}
 if(init.method==='PATCH'){assert.equal(JSON.parse(init.body).trashed,true);trashed++;return Response.json({});}
 const id=new URL(url).pathname.split('/').at(-1);return files.has(id)?new Response(files.get(id)):new Response(null,{status:404});
};
try{
 const data=randomBytes(1500000),storageKey='owner/gallery/photo-test.jpg';
 await putDriveFile('owner',storageKey,new Blob([data]).stream(),'image/jpeg','original.jpg',data.length);
 assert.equal(refreshes,1);assert.equal((await getDriveStatus('owner')).connected,true);assert.ok(!JSON.stringify(await getDriveStatus('owner')).includes(refresh));
 const file=await FILES.get(storageKey);assert.deepEqual(Buffer.from(await new Response(file.body).arrayBuffer()),data);assert.equal(file.size,data.length);assert.equal(refreshes,1,'Valid access token should be reused');
 const oldKey='owner/gallery/old-photo.png',oldBytes=Buffer.from([1,2,3]);db.prepare('INSERT INTO photo_files VALUES (?,?,?,?)').run(oldKey,'image/png',3,oldBytes);const old=await FILES.get(oldKey);assert.deepEqual(Buffer.from(old.body),oldBytes);
 uploadFailure=true;await assert.rejects(()=>putDriveFile('owner','owner/gallery/failed.jpg',new Blob([data]).stream(),'image/jpeg','failed.jpg',data.length));assert.equal(db.prepare('SELECT COUNT(*) AS count FROM drive_files').get().count,1);assert.equal(db.prepare('SELECT COUNT(*) AS count FROM photo_files').get().count,1);uploadFailure=false;
 await FILES.delete(storageKey);assert.equal(db.prepare('SELECT COUNT(*) AS count FROM drive_files').get().count,0);assert.equal(trashed,1);
 await FILES.deleteGallery('owner','gallery');assert.equal(db.prepare('SELECT bytes FROM photo_storage_usage').get().bytes,0);assert.equal(trashed,2);
 console.log('PASS credenciais criptografadas, isolamento por conta, renovação de token, envio e leitura por stream, fotos antigas e falha sem perda de arquivos');
}finally{globalThis.fetch=originalFetch;db.close();delete globalThis.driveTestEnv;}
