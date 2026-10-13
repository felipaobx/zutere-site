import { sameOrigin } from '@/lib/login-security';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { galleries, photoComments, photos } from '@/db/schema';
import { getGalleryAccess } from '@/lib/gallery-access';
import { isSelectionCompleted } from '@/lib/selection-state';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await getDb().select().from(galleries).where(eq(galleries.slug, slug)).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (!access) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  const items = await getDb().select({ photoId: photoComments.photoId, comment: photoComments.comment }).from(photoComments).where(access.role === 'owner' ? eq(photoComments.galleryId, gallery.id) : and(eq(photoComments.galleryId, gallery.id), eq(photoComments.clientToken, access.clientToken))).orderBy(desc(photoComments.updatedAt));
  return NextResponse.json({ comments: items });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const { slug } = await params;
  const db = getDb();
  const gallery = await db.select().from(galleries).where(eq(galleries.slug, slug)).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (!access) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  if (gallery.projectType !== 'delivery' && access.role !== 'owner' && await isSelectionCompleted(gallery, access)) return NextResponse.json({ error: 'A seleção já foi finalizada. Solicite a liberação ao fotógrafo.' }, { status: 423 });
  const body = await request.json().catch(() => null) as { photoId?: string; comment?: string } | null;
  if (!body || typeof body.photoId !== 'string' || typeof body.comment !== 'string' || body.comment.length > 1000) return NextResponse.json({ error: 'Comentário inválido. Use até 1.000 caracteres.' }, { status: 400 });
  const photo = await db.select({ id: photos.id }).from(photos).where(and(eq(photos.id, body.photoId), eq(photos.galleryId, gallery.id))).get();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  const comment = body.comment.trim();
  if (comment) await db.insert(photoComments).values({ id: crypto.randomUUID(), galleryId: gallery.id, photoId: photo.id, clientToken: access.clientToken, comment, updatedAt: new Date() }).onConflictDoUpdate({ target: [photoComments.clientToken, photoComments.photoId], set: { comment, updatedAt: new Date() } });
  else await db.delete(photoComments).where(and(eq(photoComments.photoId, photo.id), eq(photoComments.clientToken, access.clientToken)));
  return NextResponse.json({ ok: true, comment });
}
