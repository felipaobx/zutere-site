import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { hashToken } from '@/lib/credentials';
import { seal, unseal } from '@/lib/drive-crypto';
import { driveConfig, driveConnection, exchangeToken, googleRequest, DRIVE_REDIRECT_URI, DRIVE_SCOPE } from '@/lib/google-drive';
function finish(result: string) { const response = NextResponse.redirect('https://www.zutere.com.br/fotos/configuracoes?drive=' + result); response.cookies.set('zutere_drive_oauth', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/fotos/api/drive', maxAge: 0 }); response.headers.set('Cache-Control', 'private, no-store'); return response; }
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const user = await getChatGPTUser(), state = query.get('state'), browser = (await cookies()).get('zutere_drive_oauth')?.value;
  if (!user || !state || state.length > 256 || !browser) return finish('invalid');
  const attempt = await env.DB.prepare('DELETE FROM drive_oauth_states WHERE state_hash=? AND owner_id=? AND browser_hash=? AND expires_at>? RETURNING verifier_cipher').bind(await hashToken(state), user.userId, await hashToken(browser), Date.now()).first<{ verifier_cipher: string }>();
  if (!attempt) return finish('invalid');
  if (query.has('error')) return finish('cancelled');
  const code = query.get('code'); if (!code || code.length > 4096) return finish('invalid');
  try {
    const config = await driveConfig(user.userId); if (!config) return finish('invalid');
    const secret = await unseal(config.secret_cipher, env.DRIVE_ENCRYPTION_KEY, 'client:' + user.userId), verifier = await unseal(attempt.verifier_cipher, env.DRIVE_ENCRYPTION_KEY, 'oauth:' + user.userId);
    const tokens = await exchangeToken(new URLSearchParams({ code, client_id: config.client_id, client_secret: secret, redirect_uri: DRIVE_REDIRECT_URI, grant_type: 'authorization_code', code_verifier: verifier }));
    if (!tokens.refresh_token || !tokens.scope?.split(' ').includes(DRIVE_SCOPE)) return finish('permissions');
    const identityResponse = await googleRequest('https://www.googleapis.com/oauth2/v3/userinfo', tokens.access_token);
    const identity = await identityResponse.json() as { sub?: string; email?: string; email_verified?: boolean };
    if (!identity.sub || !identity.email || !identity.email_verified) return finish('invalid');
    const existing = await driveConnection(user.userId);
    if (existing && existing.google_subject !== identity.sub) return finish('account');
    let folderId = existing?.folder_id;
    if (!folderId) {
      const response = await googleRequest('https://www.googleapis.com/drive/v3/files?fields=id', tokens.access_token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Zutere — Seletor de fotos', mimeType: 'application/vnd.google-apps.folder' }) });
      folderId = (await response.json() as { id: string }).id;
    }
    if (!folderId || !/^[\w-]+$/.test(folderId)) return finish('invalid');
    const cipher = await seal(JSON.stringify({ refreshToken: tokens.refresh_token, accessToken: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 }), env.DRIVE_ENCRYPTION_KEY, 'tokens:' + user.userId);
    await env.DB.prepare('INSERT INTO drive_connections(owner_id,google_subject,email,folder_id,tokens_cipher,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET google_subject=excluded.google_subject,email=excluded.email,folder_id=excluded.folder_id,tokens_cipher=excluded.tokens_cipher,updated_at=excluded.updated_at').bind(user.userId, identity.sub, identity.email, folderId, cipher, Date.now()).run();
    return finish('connected');
  } catch { return finish('failed'); }
}
