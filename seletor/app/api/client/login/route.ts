import { allowLogin, sameOrigin } from '@/lib/login-security';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clientCredentials, clientSessions, clients, galleries, galleryClients, galleryCredentials, gallerySessions } from '@/db/schema';
import { hashToken, randomToken, verifyPassword } from '@/lib/credentials';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { slug?: string; login?: string; password?: string } | null;
  if (!body || (body.slug !== undefined && typeof body.slug !== 'string') || typeof body.login !== 'string' || typeof body.password !== 'string' || !body.login.trim() || !body.password || body.password.length > 512) return NextResponse.json({ error: 'Informe login e senha.' }, { status: 400 });
  body.login = body.login.trim().toLowerCase();
  if (!await allowLogin('client', body.login)) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 });
  const db = getDb();
  const clientRow = await db.select({ credential: clientCredentials, galleryId: galleries.id, clientName: clients.name })
    .from(clientCredentials)
    .innerJoin(clients, eq(clientCredentials.clientId, clients.id))
    .innerJoin(galleryClients, eq(galleryClients.clientId, clientCredentials.clientId))
    .innerJoin(galleries, eq(galleryClients.galleryId, galleries.id))
    .where(and(body.slug ? eq(galleries.slug, body.slug) : undefined, eq(clientCredentials.login, body.login.toLowerCase()))).get();
  if (clientRow && await verifyPassword(body.password, clientRow.credential.salt, clientRow.credential.passwordHash)) {
    const token = randomToken(32); const now = new Date(); const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(clientSessions).values({ id: crypto.randomUUID(), credentialId: clientRow.credential.id, tokenHash: await hashToken(token), expiresAt, createdAt: now });
    const response = NextResponse.json({ ok: true, galleryId: clientRow.galleryId, clientName: clientRow.clientName });
    response.cookies.set('lumea_gallery_session', token, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'lax', path: '/fotos', expires: expiresAt });
    return response;
  }
  const row = await db.select({ credential: galleryCredentials, galleryId: galleries.id, clientName: galleries.clientName }).from(galleryCredentials).innerJoin(galleries, eq(galleryCredentials.galleryId, galleries.id)).where(and(body.slug ? eq(galleries.slug, body.slug) : undefined, eq(galleryCredentials.login, body.login.toLowerCase()))).get();
  if (!row || !(await verifyPassword(body.password, row.credential.salt, row.credential.passwordHash))) return NextResponse.json({ error: 'Login ou senha incorretos.' }, { status: 401 });
  const token = randomToken(32); const now = new Date(); const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(gallerySessions).values({ id: crypto.randomUUID(), credentialId: row.credential.id, tokenHash: await hashToken(token), expiresAt, createdAt: now });
  const response = NextResponse.json({ ok: true, galleryId: row.galleryId, clientName: row.clientName });
  response.cookies.set('lumea_gallery_session', token, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'lax', path: '/fotos', expires: expiresAt });
  return response;
}

