import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { gallerySubmissions } from '@/db/schema';

export async function isSelectionCompleted(gallery: { id: string; status: string }, access: { role: 'owner' | 'client'; clientToken: string }) {
  if (access.role === 'owner') return gallery.status === 'completed';
  const submissions = await getDb().select({ token: gallerySubmissions.clientToken, completedAt: gallerySubmissions.completedAt }).from(gallerySubmissions).where(eq(gallerySubmissions.galleryId, gallery.id));
  const own = submissions.find((item) => item.token === access.clientToken);
  // Preserve completed galleries made before individual submissions existed.
  return Boolean(own?.completedAt) || (gallery.status === 'completed' && !submissions.some((item) => !item.token.startsWith('owner:')));
}
