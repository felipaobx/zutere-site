import { sameOrigin } from '@/lib/login-security';
import { FILES } from '@/lib/photo-storage';
import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { clients, galleries, galleryClients, gallerySubmissions, photos } from '@/db/schema';

async function ownedGallery(galleryId: string, ownerId: string) {
  return getDb().select().from(galleries).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, ownerId))).get();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ galleryId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { galleryId } = await params;
  if (!(await ownedGallery(galleryId, user.userId))) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const body = await request.json().catch(() => null) as { clientId?: string; clientIds?: string[]; reopenSelection?: boolean } | null;
  if (!body || (body.clientIds !== undefined && (!Array.isArray(body.clientIds) || !body.clientIds.every((id) => typeof id === 'string'))) || (body.clientId !== undefined && typeof body.clientId !== 'string')) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  if (body.reopenSelection === true) {
    const db = getDb();
    await db.batch([db.update(galleries).set({ status: 'selecting' }).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId))), db.update(gallerySubmissions).set({ completedAt: null }).where(eq(gallerySubmissions.galleryId, galleryId))]);
    return NextResponse.json({ ok: true, status: 'selecting' });
  }
  const clientIds = [...new Set((body.clientIds?.length ? body.clientIds : body.clientId ? [body.clientId] : []).filter(Boolean))];
  if (!clientIds.length) return NextResponse.json({ error: 'Selecione pelo menos um cliente.' }, { status: 400 });
  const linkedClients = await getDb().select().from(clients).where(and(eq(clients.ownerId, user.userId), inArray(clients.id, clientIds)));
  if (linkedClients.length !== clientIds.length) return NextResponse.json({ error: 'Um dos clientes não foi encontrado.' }, { status: 404 });
  const primary = linkedClients.find((client) => client.id === clientIds[0])!;
  const db = getDb();
  await db.batch([db.delete(galleryClients).where(eq(galleryClients.galleryId, galleryId)), db.insert(galleryClients).values(clientIds.map((clientId) => ({ id: crypto.randomUUID(), galleryId, clientId, createdAt: new Date() }))), db.update(galleries).set({ clientId: primary.id, clientName: primary.name }).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId)))]);
  return NextResponse.json({ ok: true, clientIds, clients: linkedClients.map(({ id, name, email }) => ({ id, name, email })) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ galleryId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { galleryId } = await params;
  if (!(await ownedGallery(galleryId, user.userId))) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  await FILES.deleteGallery(user.userId, galleryId);
  await getDb().delete(galleries).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId)));
  return NextResponse.json({ ok: true });
}

