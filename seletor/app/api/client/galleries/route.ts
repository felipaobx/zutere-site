import { cookies } from 'next/headers';
import { and, eq, gt, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clientSessions, clientCredentials, galleryClients, galleries, galleryCredentials, gallerySessions } from '@/db/schema';
import { hashToken } from '@/lib/credentials';
export async function GET() {
  const token = (await cookies()).get('lumea_gallery_session')?.value;
  if (!token) return NextResponse.json({ error: 'Entre para ver suas galerias.' }, { status: 401 });
  const hash = await hashToken(token), db = getDb(), now = new Date();
  const [assigned, legacy] = await Promise.all([
    db.select({ slug: galleries.slug, name: galleries.name }).from(clientSessions).innerJoin(clientCredentials, eq(clientSessions.credentialId, clientCredentials.id)).innerJoin(galleryClients, eq(galleryClients.clientId, clientCredentials.clientId)).innerJoin(galleries, eq(galleryClients.galleryId, galleries.id)).where(and(eq(clientSessions.tokenHash, hash), gt(clientSessions.expiresAt, now))).orderBy(desc(galleries.createdAt)),
    db.select({ slug: galleries.slug, name: galleries.name }).from(gallerySessions).innerJoin(galleryCredentials, eq(gallerySessions.credentialId, galleryCredentials.id)).innerJoin(galleries, eq(galleryCredentials.galleryId, galleries.id)).where(and(eq(gallerySessions.tokenHash, hash), gt(gallerySessions.expiresAt, now))),
  ]);
  if (!assigned.length && !legacy.length) return NextResponse.json({ error: 'Seu acesso expirou ou não há galerias vinculadas.' }, { status: 401 });
  return NextResponse.json({ galleries: [...new Map([...assigned, ...legacy].map(item => [item.slug, item])).values()] }, { headers: { 'Cache-Control': 'private, no-store' } });
}
