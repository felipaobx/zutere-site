import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDriveStatus } from '@/lib/google-drive';
export async function GET() { const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 }); return NextResponse.json(await getDriveStatus(user.userId), { headers: { 'Cache-Control': 'private, no-store' } }); }
