import { sameOrigin } from '@/lib/login-security';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { deliveries, galleries, photos } from '@/db/schema';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const db = getDb();
  const rows = await db.select({ delivery: deliveries, gallery: galleries }).from(deliveries).innerJoin(galleries, eq(deliveries.galleryId, galleries.id)).where(eq(deliveries.ownerId, user.userId)).orderBy(desc(deliveries.createdAt));
  const items = await Promise.all(rows.map(async ({ delivery, gallery }) => {
    const files = await db.select({ size: photos.size }).from(photos).where(eq(photos.galleryId, gallery.id));
    return { ...delivery, title: gallery.name, client: gallery.clientName, slug: gallery.slug, photoCount: files.length, size: files.reduce((total, file) => total + file.size, 0), status: delivery.expiresAt && delivery.expiresAt < new Date() ? 'expired' : delivery.status };
  }));
  return NextResponse.json({ deliveries: items });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { galleryId?: string; expiresAt?: string } | null;
  if (!body?.galleryId) return NextResponse.json({ error: 'Escolha uma galeria de entrega.' }, { status: 400 });
  const db = getDb();
  const gallery = await db.select().from(galleries).where(and(eq(galleries.id, body.galleryId), eq(galleries.ownerId, user.userId), eq(galleries.projectType, 'delivery'))).get();
  if (!gallery) return NextResponse.json({ error: 'Escolha uma galeria do tipo Entrega.' }, { status: 404 });
  const files = await db.select({ id: photos.id }).from(photos).where(eq(photos.galleryId, gallery.id));
  if (!files.length) return NextResponse.json({ error: 'Envie fotos para a galeria antes de liberar a entrega.' }, { status: 400 });
  const expiresAt = body.expiresAt ? new Date(body.expiresAt + 'T23:59:59') : null;
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt < new Date())) return NextResponse.json({ error: 'Escolha um prazo futuro.' }, { status: 400 });
  await db.insert(deliveries).values({ id: crypto.randomUUID(), ownerId: user.userId, galleryId: gallery.id, status: 'ready', expiresAt, createdAt: new Date() }).onConflictDoUpdate({ target: deliveries.galleryId, set: { status: 'ready', expiresAt } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
