import { FILES } from '@/lib/photo-storage';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { deliveries, galleries, photos } from '@/db/schema';
import { getGalleryAccess } from '@/lib/gallery-access';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; photoId: string }> }) {
  const { slug, photoId } = await params;
  const row = await getDb().select({ galleryId: galleries.id, ownerId: galleries.ownerId, projectType: galleries.projectType, filename: photos.filename, storageKey: photos.storageKey, contentType: photos.contentType })
    .from(photos).innerJoin(galleries, eq(photos.galleryId, galleries.id))
    .where(and(eq(galleries.slug, slug), eq(photos.id, photoId))).get();
  if (!row) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  const access = await getGalleryAccess(row.galleryId, row.ownerId);
  if (!access) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  const download = new URL(request.url).searchParams.get('download') === '1';
  if (download && access.role !== 'owner') {
    if (row.projectType !== 'delivery') return NextResponse.json({ error: 'O download desta galeria não está liberado.' }, { status: 403 });
    const delivery = await getDb().select().from(deliveries).where(eq(deliveries.galleryId, row.galleryId)).get();
    if (!delivery || !['ready', 'delivered'].includes(delivery.status) || (delivery.expiresAt && delivery.expiresAt < new Date())) return NextResponse.json({ error: 'A entrega ainda não foi liberada ou o prazo expirou.' }, { status: 403 });
    if (delivery.downloadLimit !== null && delivery.downloadCount >= delivery.downloadLimit) return NextResponse.json({ error: 'O limite de downloads foi atingido.' }, { status: 403 });
  }
  const object = await FILES.get(row.storageKey);
  if (!object) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
  if (download && access.role !== 'owner') {
    const db = getDb();
    await db.batch([db.update(deliveries).set({ downloadCount: sql`${deliveries.downloadCount} + 1`, status: 'delivered' }).where(eq(deliveries.galleryId, row.galleryId)), db.update(galleries).set({ status: 'completed' }).where(eq(galleries.id, row.galleryId))]);
  }
  return new Response(object.body, { headers: { 'content-type': row.contentType, 'content-length': String(object.size), 'cache-control': download ? 'private, no-store' : 'private, max-age=3600', 'x-content-type-options': 'nosniff', ...(download ? { 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}` } : {}) } });
}
