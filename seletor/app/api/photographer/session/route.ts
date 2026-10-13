import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function GET() {
  const user = await getChatGPTUser();
  return user ? NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'private, no-store' } }) : NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
}
