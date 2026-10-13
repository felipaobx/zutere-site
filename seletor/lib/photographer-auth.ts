import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt } from 'drizzle-orm';
import { getDb } from '@/db';
import { photographers, photographerSessions } from '@/db/schema';
import { hashToken } from '@/lib/credentials';
export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
 const token=(await cookies()).get('zutere_photographer')?.value;if(!token)return null;
 const row=await getDb().select({id:photographers.id,email:photographers.email,name:photographers.name}).from(photographerSessions).innerJoin(photographers,eq(photographerSessions.photographerId,photographers.id)).where(and(eq(photographerSessions.tokenHash,await hashToken(token)),gt(photographerSessions.expiresAt,new Date()))).get();
 return row?{userId:row.id,email:row.email,displayName:row.name,fullName:row.name}:null;
}
export async function requireChatGPTUser(returnTo:string) {const user=await getChatGPTUser();if(user)return user;redirect(chatGPTSignInPath(returnTo));}
export function chatGPTSignInPath(returnTo:string) {return '/fotos/fotografo?next='+encodeURIComponent(safeReturnPath(returnTo));}
export function chatGPTSignOutPath() {return '/fotos/sair';}
export function safeReturnPath(value:string) {return value.startsWith('/fotos/')&&!value.includes('\\')?value:'/fotos/fotografo/painel';}
