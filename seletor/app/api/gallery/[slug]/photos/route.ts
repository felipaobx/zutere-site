import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { deliveries, galleries, photos } from '@/db/schema';
import { getGalleryAccess } from '@/lib/gallery-access';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await getDb().select().from(galleries).where(eq(galleries.slug, slug)).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (!access) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  const delivery = gallery.projectType === 'delivery' ? await getDb().select().from(deliveries).where(eq(deliveries.galleryId, gallery.id)).get() : null;
  const canDownload = access.role === 'owner' || Boolean(delivery && ['ready', 'delivered'].includes(delivery.status) && (!delivery.expiresAt || delivery.expiresAt > new Date()) && (delivery.downloadLimit === null || delivery.downloadCount < delivery.downloadLimit));
  const items = await getDb().select({ id: photos.id, filename: photos.filename, isCover: photos.isCover })
    .from(photos).where(eq(photos.galleryId, gallery.id)).orderBy(asc(photos.sortOrder));
  const cover = items.find((photo) => photo.isCover) ?? items[0];
  return NextResponse.json({ photos: items.map((photo) => ({ ...photo, src: `/fotos/api/gallery/${slug}/photos/${photo.id}` })), coverUrl: cover ? `/fotos/api/gallery/${slug}/photos/${cover.id}` : null, canDownload });
}
