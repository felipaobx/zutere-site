import { sameOrigin } from '@/lib/login-security';
import { FILES, MAX_PHOTO_BYTES } from '@/lib/photo-storage';
import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { galleries, photos } from '@/db/schema';

export async function GET(_: Request, { params }: { params: Promise<{ galleryId: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { galleryId } = await params;
  const gallery = await getDb().select().from(galleries).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId))).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const files = await getDb().select({ id: photos.id, filename: photos.filename, isCover: photos.isCover, size: photos.size }).from(photos).where(eq(photos.galleryId, galleryId)).orderBy(asc(photos.sortOrder));
  return NextResponse.json({ photos: files.map((photo) => ({ ...photo, src: `/fotos/api/gallery/${gallery.slug}/photos/${photo.id}` })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ galleryId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { galleryId } = await params;
  const gallery = await getDb().select().from(galleries).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId))).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  try {
    const maxBytes = MAX_PHOTO_BYTES;
    if (Number(request.headers.get('content-length')) >= maxBytes && !request.headers.get('content-type')?.startsWith('multipart/form-data')) return NextResponse.json({ error: 'Use uma foto otimizada com menos de 1 MB no plano gratuito.' }, { status: 413 });
    const multipart = request.headers.get('content-type')?.startsWith('multipart/form-data');
    const form = multipart ? await request.formData() : null;
    if (!multipart && !['image/jpeg', 'image/png', 'image/webp'].includes(request.headers.get('content-type') ?? '')) return NextResponse.json({ error: 'Envie uma imagem JPG, PNG ou WebP válida.' }, { status: 400 });
    const decodeFilename = (header: string, fallback: string) => { try { return decodeURIComponent(request.headers.get(header) ?? fallback); } catch { return fallback; } };
    const file = form ? form.get('photo') : new File([await request.blob()], decodeFilename('x-photo-filename', 'foto'), { type: request.headers.get('content-type') ?? '' });
    if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size) return NextResponse.json({ error: 'Envie uma imagem JPG, PNG ou WebP válida.' }, { status: 400 });
    if (file.size >= maxBytes) return NextResponse.json({ error: 'Use uma foto otimizada com menos de 1 MB no plano gratuito.' }, { status: 413 });
    const photoId = crypto.randomUUID();
    const requestedOriginalName = form ? form.get('originalName') : decodeFilename('x-original-filename', file.name);
    const originalName = (typeof requestedOriginalName === 'string' && requestedOriginalName.trim() ? requestedOriginalName : file.name).replace(/[\\/]/g, '-').slice(-255);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
    const storageKey = `${user.userId}/${galleryId}/${photoId}-${safeName}`;
    let isCover = false;
    await FILES.put(storageKey, file.stream(), { httpMetadata: { contentType: file.type } });
    try {
      const db = getDb();
      const currentCover = await db.select({ id: photos.id }).from(photos).where(and(eq(photos.galleryId, galleryId), eq(photos.isCover, true))).get();
      isCover = !currentCover;
      await db.insert(photos).values({ id: photoId, galleryId, storageKey, filename: originalName, contentType: file.type, size: file.size, sortOrder: Date.now(), isCover, createdAt: new Date() });
      if (gallery.status === 'draft') await db.update(galleries).set({ status: 'selecting' }).where(eq(galleries.id, galleryId));
    }
    catch (error) { await FILES.delete(storageKey); throw error; }
    console.info('[gallery-photo-upload] completed', { galleryId, photoId, filename: originalName, size: file.size });
    return NextResponse.json({ photo: { id: photoId, filename: originalName, isCover } }, { status: 201 });
  } catch (error) {
    console.error('[gallery-photo-upload] failed', { galleryId, error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && /CHECK constraint failed/.test(error.message)) return NextResponse.json({ error: 'O espaço gratuito de 350 MiB foi preenchido. Exclua fotos antigas para liberar espaço.' }, { status: 507 });
    return NextResponse.json({ error: 'O arquivo chegou ao sistema, mas não pôde ser armazenado. Tente novamente.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ galleryId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { galleryId } = await params;
  const gallery = await getDb().select({ id: galleries.id }).from(galleries).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId))).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const body = await request.json() as { photoId?: string };
  if (!body.photoId) return NextResponse.json({ error: 'Selecione uma foto para a capa.' }, { status: 400 });
  const photo = await getDb().select({ id: photos.id }).from(photos).where(and(eq(photos.id, body.photoId), eq(photos.galleryId, galleryId))).get();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada nesta galeria.' }, { status: 404 });
  const db = getDb();
  await db.batch([db.update(photos).set({ isCover: false }).where(eq(photos.galleryId, galleryId)), db.update(photos).set({ isCover: true }).where(and(eq(photos.id, body.photoId), eq(photos.galleryId, galleryId)))]);
  return NextResponse.json({ ok: true, photoId: body.photoId });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ galleryId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { galleryId } = await params;
  const db = getDb();
  const gallery = await db.select().from(galleries).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId))).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const body = await request.json().catch(() => null) as { photoId?: string } | null;
  if (!body?.photoId) return NextResponse.json({ error: 'Selecione a foto.' }, { status: 400 });
  const photo = await db.select().from(photos).where(and(eq(photos.id, body.photoId), eq(photos.galleryId, galleryId))).get();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  await FILES.delete(photo.storageKey);
  await db.delete(photos).where(eq(photos.id, photo.id));
  if (photo.isCover) {
    const next = await db.select({ id: photos.id }).from(photos).where(eq(photos.galleryId, galleryId)).orderBy(asc(photos.sortOrder)).get();
    if (next) await db.update(photos).set({ isCover: true }).where(eq(photos.id, next.id));
  }
  return NextResponse.json({ ok: true });
}

