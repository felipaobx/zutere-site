import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { hashToken } from './credentials';
export async function allowLogin(scope:string,login:string) {
 const ip=(await headers()).get('cf-connecting-ip')??'unknown';
 const key=await hashToken(scope+':'+ip+':'+login.toLowerCase());const now=Date.now();
 const row=await env.DB.prepare('INSERT INTO login_attempts (key,attempts,resets_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN resets_at < ? THEN 1 ELSE attempts+1 END, resets_at=CASE WHEN resets_at < ? THEN ? ELSE resets_at END RETURNING attempts').bind(key,now+15*60*1000,now,now,now+15*60*1000).first<{attempts:number}>();
 return Boolean(row&&row.attempts<=10);
}
export function sameOrigin(request:Request) {
 const origin=request.headers.get('origin');if(!origin)return false;
 return ['https://zutere.com.br','https://www.zutere.com.br',new URL(request.url).origin].includes(origin);
}
