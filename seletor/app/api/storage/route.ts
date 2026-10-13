import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function GET(){if(!await getChatGPTUser())return NextResponse.json({error:'Autenticação necessária.'},{status:401});const usage=await env.DB.prepare('SELECT bytes FROM photo_storage_usage WHERE id=1').first<{bytes:number}>();return NextResponse.json({used:usage?.bytes??0,limit:367001600},{headers:{'Cache-Control':'private, no-store'}});}
