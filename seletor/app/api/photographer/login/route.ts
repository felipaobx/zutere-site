import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { photographers, photographerSessions } from '@/db/schema';
import { hashToken, randomToken, verifyPassword, hashPassword } from '@/lib/credentials';
import { allowLogin, sameOrigin } from '@/lib/login-security';
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:'Origem inválida.'},{status:403});
 const body=await request.json().catch(()=>null) as {email?:string;password?:string}|null;
 if(typeof body?.email!=='string'||typeof body?.password!=='string'||body.email.length>254||body.password.length>512||!body.password)return NextResponse.json({error:'Informe e-mail e senha.'},{status:400});
 const email=body.email.trim().toLowerCase();
 if(!await allowLogin('photographer',email))return NextResponse.json({error:'Muitas tentativas. Tente novamente em 15 minutos.'},{status:429});
 const db=getDb();const user=await db.select().from(photographers).where(eq(photographers.email,email)).get();
 const valid=user?await verifyPassword(body.password,user.salt,user.passwordHash):(await hashPassword(body.password,'invalid-account'),false);
 if(!user||!valid)return NextResponse.json({error:'E-mail ou senha incorretos.'},{status:401});
 const token=randomToken(32), now=new Date(),expiresAt=new Date(Date.now()+8*60*60*1000);
 await db.insert(photographerSessions).values({id:crypto.randomUUID(),photographerId:user.id,tokenHash:await hashToken(token),createdAt:now,expiresAt});
 const response=NextResponse.json({ok:true});response.cookies.set('zutere_photographer',token,{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'lax',path:'/',expires:expiresAt});response.headers.set('Cache-Control','no-store');return response;
}

