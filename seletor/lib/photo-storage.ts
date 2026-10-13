import { env } from 'cloudflare:workers';
// Small optimized previews fit within D1's row and free database limits.
// Original large files require object storage; they are never silently downscaled here.
export const MAX_PHOTO_BYTES = 1_000_000;
export const FILES = {
 async put(key:string,stream:ReadableStream<Uint8Array>,options:{httpMetadata:{contentType:string}}){
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
  if(bytes.length>=MAX_PHOTO_BYTES)throw new Error('A foto deve ter menos de 1 MB no plano gratuito.');
  await env.DB.prepare('INSERT INTO photo_files (storage_key,content_type,size,data) VALUES (?,?,?,?)').bind(key,options.httpMetadata.contentType,bytes.length,bytes.buffer).run();
 },
 async get(key:string){
  const row=await env.DB.prepare('SELECT content_type, size, data FROM photo_files WHERE storage_key = ?').bind(key).first<{content_type:string;size:number;data:number[]}>();
  if(!row)return null;
  return {body:new Uint8Array(row.data),size:row.size,httpEtag:'"'+encodeURIComponent(key)+'"',writeHttpMetadata(headers:Headers){headers.set('Content-Type',row.content_type);}};
 },
 async delete(keys:string|string[]){
  const list=typeof keys==='string'?[keys]:keys;
  for(let index=0;index<list.length;index+=40)await env.DB.batch(list.slice(index,index+40).map(key=>env.DB.prepare('DELETE FROM photo_files WHERE storage_key = ?').bind(key)));
 }
};
