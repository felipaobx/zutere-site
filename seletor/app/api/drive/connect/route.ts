import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { sameOrigin } from '@/lib/login-security';
import { hashToken, randomToken } from '@/lib/credentials';
import { seal } from '@/lib/drive-crypto';
import { driveConfig, DRIVE_REDIRECT_URI, DRIVE_SCOPE } from '@/lib/google-drive';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  if (request.headers.get('origin') !== 'https://www.zutere.com.br') return NextResponse.json({ error: 'Conecte o Drive acessando https://www.zutere.com.br/fotografo.' }, { status: 400 });
  const config = await driveConfig(user.userId);
  if (!config || !env.DRIVE_ENCRYPTION_KEY) return NextResponse.json({ error: 'Configure primeiro o aplicativo Google nas opções de armazenamento.' }, { status: 409 });
  const state = randomToken(32), browser = randomToken(32), verifier = randomToken(32);
  await env.DB.prepare('INSERT INTO drive_oauth_states(state_hash,owner_id,browser_hash,verifier_cipher,expires_at) VALUES (?,?,?,?,?)').bind(await hashToken(state), user.userId, await hashToken(browser), await seal(verifier, env.DRIVE_ENCRYPTION_KEY, 'oauth:' + user.userId), Date.now() + 600_000).run();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: config.client_id, redirect_uri: DRIVE_REDIRECT_URI, response_type: 'code', scope: DRIVE_SCOPE + ' openid email', access_type: 'offline', prompt: 'consent', state, code_challenge: await hashToken(verifier), code_challenge_method: 'S256' }).toString();
  const response = NextResponse.json({ url: url.toString() });
  response.cookies.set('zutere_drive_oauth', browser, { httpOnly: true, secure: true, sameSite: 'lax', path: '/fotos/api/drive', maxAge: 600 });
  response.headers.set('Cache-Control', 'private, no-store'); return response;
}
