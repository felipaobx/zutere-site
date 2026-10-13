import { sameOrigin } from '@/lib/login-security';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { galleries, gallerySubmissions, photos, selections } from '@/db/schema';
import { getGalleryAccess } from '@/lib/gallery-access';
import { isSelectionCompleted } from '@/lib/selection-state';

async function resolveGallery(slug: string) {
  return getDb().select().from(galleries).where(eq(galleries.slug, slug)).get();
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await resolveGallery(slug);
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (!access) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });

  const items = await getDb().select({ photoId: selections.photoId })
    .from(selections)
    .where(access.role === 'owner'
      ? eq(selections.galleryId, gallery.id)
      : and(eq(selections.galleryId, gallery.id), eq(selections.clientToken, access.clientToken)));
  const submission = await getDb().select({ message: gallerySubmissions.message }).from(gallerySubmissions).where(and(eq(gallerySubmissions.galleryId, gallery.id), eq(gallerySubmissions.clientToken, access.clientToken))).get();
  return NextResponse.json({ photoIds: [...new Set(items.map((item) => item.photoId))], message: submission?.message ?? '', completed: await isSelectionCompleted(gallery, access), canEditCompleted: access.role === 'owner' });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const { slug } = await params;
  const gallery = await resolveGallery(slug);
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (!access) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  if (access.role !== 'owner' && await isSelectionCompleted(gallery, access)) return NextResponse.json({ error: 'Solicite ao fotógrafo a liberação desta seleção para editar novamente.' }, { status: 423 });
  const body = await request.json().catch(() => null) as { photoIds?: unknown } | null;
  if (!Array.isArray(body?.photoIds) || !body.photoIds.every((id) => typeof id === 'string' && id.length > 0)) return NextResponse.json({ error: 'Seleção inválida.' }, { status: 400 });
  const photoIds = [...new Set(body.photoIds as string[])];
  const db = getDb();
  const validPhotos = photoIds.length ? await db.select({ id: photos.id }).from(photos).where(and(eq(photos.galleryId, gallery.id), inArray(photos.id, photoIds))) : [];
  if (validPhotos.length !== photoIds.length) return NextResponse.json({ error: 'A seleção contém uma foto inválida.' }, { status: 400 });
  const scope = access.role === 'owner' ? eq(selections.galleryId, gallery.id) : and(eq(selections.galleryId, gallery.id), eq(selections.clientToken, access.clientToken));
  const current = await db.select({ photoId: selections.photoId }).from(selections).where(scope);
  const existing = new Set(current.map((item) => item.photoId));
  const additions = validPhotos.filter((photo) => !existing.has(photo.id));
  // Keep unchanged selections, client attribution and comments intact.
  const remove = db.delete(selections).where(photoIds.length ? and(scope, notInArray(selections.photoId, photoIds)) : scope);
  const update = db.update(galleries).set({ status: gallery.status === 'draft' ? 'selecting' : gallery.status }).where(eq(galleries.id, gallery.id));
  if (additions.length) {
    await db.batch([remove, db.insert(selections).values(additions.map((photo) => ({ id: crypto.randomUUID(), galleryId: gallery.id, photoId: photo.id, clientToken: access.clientToken, selectedAt: new Date() }))).onConflictDoNothing(), update]);
  } else {
    await db.batch([remove, update]);
  }
  return NextResponse.json({ ok: true, selectedCount: photoIds.length });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const { slug } = await params;
  const gallery = await resolveGallery(slug);
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (!access) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });

  if (access.role !== 'owner' && await isSelectionCompleted(gallery, access)) return NextResponse.json({ error: 'Solicite ao fotógrafo a liberação desta seleção para editar novamente.' }, { status: 423 });

  const body = await request.json().catch(() => null) as { photoIds?: string[]; message?: string } | null;
  if (!body || !Array.isArray(body.photoIds) || !body.photoIds.every((id) => typeof id === 'string') || (body.message !== undefined && typeof body.message !== 'string')) return NextResponse.json({ error: 'Seleção inválida.' }, { status: 400 });
  const photoIds = [...new Set((body.photoIds ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0))];
  if (!photoIds.length) return NextResponse.json({ error: 'Selecione pelo menos uma foto.' }, { status: 400 });
  const validPhotos = await getDb().select({ id: photos.id }).from(photos)
    .where(and(eq(photos.galleryId, gallery.id), inArray(photos.id, photoIds)));
  if (validPhotos.length !== photoIds.length) return NextResponse.json({ error: 'A seleção contém uma foto inválida.' }, { status: 400 });

  const db = getDb();
  const remove = db.delete(selections).where(access.role === 'owner'
    ? eq(selections.galleryId, gallery.id)
    : and(eq(selections.galleryId, gallery.id), eq(selections.clientToken, access.clientToken)));
  const now = new Date();
  const message = body.message?.trim().slice(0, 1000) || null;
  const insert = db.insert(selections).values(validPhotos.map((photo, index) => ({
    id: crypto.randomUUID(),
    galleryId: gallery.id,
    photoId: photo.id,
    clientToken: access.clientToken,
    comment: index === 0 ? message : null,
    selectedAt: now,
  })));
  const submission = db.insert(gallerySubmissions).values({ id: crypto.randomUUID(), galleryId: gallery.id, clientToken: access.clientToken, message, completedAt: now, updatedAt: now }).onConflictDoUpdate({ target: [gallerySubmissions.galleryId, gallerySubmissions.clientToken], set: { message, completedAt: now, updatedAt: now } });
  const status = access.role === 'owner' ? 'completed' : sql`CASE WHEN
    NOT EXISTS (SELECT 1 FROM gallery_clients gc INNER JOIN client_credentials cc ON gc.client_id = cc.client_id WHERE gc.gallery_id = ${gallery.id} AND NOT EXISTS (SELECT 1 FROM gallery_submissions gs WHERE gs.gallery_id = ${gallery.id} AND gs.client_token = 'client:' || cc.id AND gs.completed_at IS NOT NULL))
    AND NOT EXISTS (SELECT 1 FROM gallery_credentials lc WHERE lc.gallery_id = ${gallery.id} AND NOT EXISTS (SELECT 1 FROM gallery_submissions gs WHERE gs.gallery_id = ${gallery.id} AND gs.client_token = 'credential:' || lc.id AND gs.completed_at IS NOT NULL))
    THEN 'completed' ELSE 'selecting' END`;
  await db.batch([remove, insert, submission, db.update(galleries).set({ status }).where(eq(galleries.id, gallery.id))]);
  return NextResponse.json({ ok: true, selectedCount: validPhotos.length });
}
