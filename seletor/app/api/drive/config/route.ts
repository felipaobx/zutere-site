import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { photographers } from '@/db/schema';
import { verifyPassword } from '@/lib/credentials';
import { allowLogin, sameOrigin } from '@/lib/login-security';
import { seal } from '@/lib/drive-crypto';
import { driveConfig, driveConnection } from '@/lib/google-drive';
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { clientId?: unknown; clientSecret?: unknown; currentPassword?: unknown } | null;
  if (!body || typeof body.clientId !== 'string' || typeof body.clientSecret !== 'string' || typeof body.currentPassword !== 'string' || !/^[a-zA-Z0-9._-]+\.apps\.googleusercontent\.com$/.test(body.clientId.trim()) || body.clientId.length > 254 || !body.clientSecret.trim() || body.clientSecret.length > 512 || !body.currentPassword || body.currentPassword.length > 512) return NextResponse.json({ error: 'Informe o ID, a chave do aplicativo Google e sua senha atual.' }, { status: 400 });
  if (!env.DRIVE_ENCRYPTION_KEY) return NextResponse.json({ error: 'A conexão ainda está sendo preparada. Tente novamente mais tarde.' }, { status: 503 });
  if (!await allowLogin('drive-config', user.userId)) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 });
  const owner = await getDb().select().from(photographers).where(eq(photographers.id, user.userId)).get();
  if (!owner || !await verifyPassword(body.currentPassword, owner.salt, owner.passwordHash)) return NextResponse.json({ error: 'A senha atual está incorreta.' }, { status: 403 });
  const [connection, configuration] = await Promise.all([driveConnection(user.userId), driveConfig(user.userId)]);
  if (connection && configuration?.client_id !== body.clientId.trim()) return NextResponse.json({ error: 'Mantenha o mesmo aplicativo Google para preservar o acesso às fotos já enviadas.' }, { status: 409 });
  const cipher = await seal(body.clientSecret.trim(), env.DRIVE_ENCRYPTION_KEY, 'client:' + user.userId);
  await env.DB.prepare('INSERT INTO drive_configs(owner_id,client_id,secret_cipher,updated_at) VALUES (?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET client_id=excluded.client_id,secret_cipher=excluded.secret_cipher,updated_at=excluded.updated_at').bind(user.userId, body.clientId.trim(), cipher, Date.now()).run();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
