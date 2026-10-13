import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { clientSessions, gallerySessions, photographerSessions } from '@/db/schema';
import { hashToken } from '@/lib/credentials';
import { sameOrigin } from '@/lib/login-security';
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:'Origem inválida.'},{status:403});
 const jar=await cookies(),db=getDb();const owner=jar.get('zutere_photographer')?.value,client=jar.get('lumea_gallery_session')?.value;
 if(owner)await db.delete(photographerSessions).where(eq(photographerSessions.tokenHash,await hashToken(owner)));
 if(client){const hash=await hashToken(client);await db.delete(clientSessions).where(eq(clientSessions.tokenHash,hash));await db.delete(gallerySessions).where(eq(gallerySessions.tokenHash,hash));}
 const response=NextResponse.json({ok:true});for(const name of ['zutere_photographer','lumea_gallery_session'])response.cookies.set(name,'',{httpOnly:true,sameSite:'lax',secure:new URL(request.url).protocol==='https:',path:name==='zutere_photographer'?'/':'/fotos',maxAge:0});return response;
}
