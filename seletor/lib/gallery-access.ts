import { cookies } from 'next/headers';
import { and, eq, gt } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { clientCredentials, clientSessions, galleryClients, galleryCredentials, gallerySessions } from '@/db/schema';
import { hashToken } from '@/lib/credentials';

export async function canAccessGallery(galleryId: string, ownerId: string) {
  return Boolean(await getGalleryAccess(galleryId, ownerId));
}

export async function getGalleryAccess(galleryId: string, ownerId: string) {
  const user = await getChatGPTUser();
  if (user?.userId === ownerId) return { role: 'owner' as const, clientToken: `owner:${ownerId}` };

  const token = (await cookies()).get('lumea_gallery_session')?.value;
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const clientSession = await getDb().select({ galleryId: galleryClients.galleryId, credentialId: clientCredentials.id })
    .from(clientSessions)
    .innerJoin(clientCredentials, eq(clientSessions.credentialId, clientCredentials.id))
    .innerJoin(galleryClients, eq(galleryClients.clientId, clientCredentials.clientId))
    .where(and(eq(clientSessions.tokenHash, tokenHash), eq(galleryClients.galleryId, galleryId), gt(clientSessions.expiresAt, new Date())))
    .get();
  if (clientSession?.galleryId === galleryId) return { role: 'client' as const, clientToken: `client:${clientSession.credentialId}` };
  const session = await getDb().select({ galleryId: galleryCredentials.galleryId, credentialId: galleryCredentials.id })
    .from(gallerySessions)
    .innerJoin(galleryCredentials, eq(gallerySessions.credentialId, galleryCredentials.id))
    .where(and(eq(gallerySessions.tokenHash, tokenHash), eq(galleryCredentials.galleryId, galleryId), gt(gallerySessions.expiresAt, new Date())))
    .get();
  return session?.galleryId === galleryId
    ? { role: 'client' as const, clientToken: `credential:${session.credentialId}` }
    : null;
}
