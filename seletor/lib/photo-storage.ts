import { env } from 'cloudflare:workers';
import { driveConnection, driveToken, googleRequest, putDriveFile, DRIVE_PHOTO_BYTES } from './google-drive';
// Small optimized previews fit within D1's row and free database limits.
// Original large files require object storage; they are never silently downscaled here.
export const MAX_PHOTO_BYTES = 1_000_000;
export async function photoStorageLimits(ownerId: string) { const connected = Boolean(await driveConnection(ownerId)); return { provider: connected ? 'drive' : 'database', maxPhotoBytes: connected ? DRIVE_PHOTO_BYTES : MAX_PHOTO_BYTES }; }
export const FILES = {
 async put(key:string,stream:ReadableStream<Uint8Array>,options:{httpMetadata:{contentType:string};filename?:string;size?:number}){
  const ownerId=key.split('/')[0];
  if(await driveConnection(ownerId)){
    if(!options.size||options.size>=DRIVE_PHOTO_BYTES)throw new Error('Envie uma foto com menos de 20 MB.');
    await putDriveFile(ownerId,key,stream,options.httpMetadata.contentType,options.filename??key.split('/').at(-1)!,options.size);return;
  }
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
  if(bytes.length>=MAX_PHOTO_BYTES)throw new Error('A foto deve ter menos de 1 MB no plano gratuito.');
  await env.DB.prepare('INSERT INTO photo_files (storage_key,content_type,size,data) VALUES (?,?,?,?)').bind(key,options.httpMetadata.contentType,bytes.length,bytes.buffer).run();
 },
 async get(key:string){
  const remote=await env.DB.prepare('SELECT owner_id,remote_file_id,content_type,size FROM drive_files WHERE storage_key=?').bind(key).first<{owner_id:string;remote_file_id:string;content_type:string;size:number}>();
  if(remote){const {token}=await driveToken(remote.owner_id);const response=await googleRequest('https://www.googleapis.com/drive/v3/files/'+remote.remote_file_id+'?alt=media',token);if(response.status===404)return null;return {body:response.body,size:remote.size,httpEtag:'"'+remote.remote_file_id+'"',writeHttpMetadata(headers:Headers){headers.set('Content-Type',remote.content_type);}};}
  const row=await env.DB.prepare('SELECT content_type, size, data FROM photo_files WHERE storage_key = ?').bind(key).first<{content_type:string;size:number;data:number[]}>();
  if(!row)return null;
  return {body:new Uint8Array(row.data),size:row.size,httpEtag:'"'+encodeURIComponent(key)+'"',writeHttpMetadata(headers:Headers){headers.set('Content-Type',row.content_type);}};
 },
 async delete(keys:string|string[]){
  const list=typeof keys==='string'?[keys]:keys;
  for(const key of list){const remote=await env.DB.prepare('SELECT owner_id,remote_file_id FROM drive_files WHERE storage_key=?').bind(key).first<{owner_id:string;remote_file_id:string}>();if(remote){const {token}=await driveToken(remote.owner_id);await googleRequest('https://www.googleapis.com/drive/v3/files/'+remote.remote_file_id,token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed:true})});await env.DB.prepare('DELETE FROM drive_files WHERE storage_key=?').bind(key).run();}}
  for(let index=0;index<list.length;index+=40)await env.DB.batch(list.slice(index,index+40).map(key=>env.DB.prepare('DELETE FROM photo_files WHERE storage_key = ?').bind(key)));
 },
 async deleteGallery(ownerId:string,galleryId:string){
  const folder=await env.DB.prepare('SELECT remote_folder_id FROM drive_gallery_folders WHERE gallery_id=? AND owner_id=?').bind(galleryId,ownerId).first<{remote_folder_id:string}>();
  if(folder){const {token}=await driveToken(ownerId);await googleRequest('https://www.googleapis.com/drive/v3/files/'+folder.remote_folder_id,token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed:true})});}
  const prefix=ownerId+'/'+galleryId+'/';
  await env.DB.batch([env.DB.prepare('DELETE FROM drive_files WHERE owner_id=? AND substr(storage_key,1,?)=?').bind(ownerId,prefix.length,prefix),env.DB.prepare('DELETE FROM photo_files WHERE substr(storage_key,1,?)=?').bind(prefix.length,prefix),env.DB.prepare('DELETE FROM drive_gallery_folders WHERE gallery_id=? AND owner_id=?').bind(galleryId,ownerId)]);
 }
};
