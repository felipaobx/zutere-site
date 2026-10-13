import { sameOrigin } from '@/lib/login-security';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { clientCredentials, clients, galleries, galleryClients, gallerySubmissions, photoComments, photos, selections } from '@/db/schema';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const db = getDb();
  const items = await db.select().from(galleries).where(eq(galleries.ownerId, user.userId)).orderBy(desc(galleries.createdAt));
  const enriched = await Promise.all(items.map(async (gallery) => {
    const galleryPhotos = await db.select({ id: photos.id, isCover: photos.isCover }).from(photos).where(eq(photos.galleryId, gallery.id)).orderBy(asc(photos.sortOrder));
    const coverPhoto = galleryPhotos.find((photo) => photo.isCover) ?? galleryPhotos[0];
    const selectedPhotos = await db.select({ id: photos.id, filename: photos.filename, selectedAt: selections.selectedAt, comment: selections.comment })
      .from(selections)
      .innerJoin(photos, eq(selections.photoId, photos.id))
      .where(eq(selections.galleryId, gallery.id))
      .orderBy(asc(photos.sortOrder));
    let linkedClients = await db.select({ id: clients.id, name: clients.name, email: clients.email, login: clientCredentials.login })
      .from(galleryClients)
      .innerJoin(clients, eq(galleryClients.clientId, clients.id))
      .leftJoin(clientCredentials, eq(clientCredentials.clientId, clients.id))
      .where(eq(galleryClients.galleryId, gallery.id));
    if (!linkedClients.length && gallery.clientId) {
      linkedClients = await db.select({ id: clients.id, name: clients.name, email: clients.email, login: clientCredentials.login })
        .from(clients).leftJoin(clientCredentials, eq(clientCredentials.clientId, clients.id))
        .where(and(eq(clients.ownerId, gallery.ownerId), eq(clients.id, gallery.clientId)));
    }
    const comments = await db.select({ photoId: photoComments.photoId, comment: photoComments.comment }).from(photoComments).where(eq(photoComments.galleryId, gallery.id));
    const uniquePhotos = [...new Map(selectedPhotos.map((photo) => [photo.id, photo])).values()];
    const submissions = await db.select({ message: gallerySubmissions.message, completedAt: gallerySubmissions.completedAt }).from(gallerySubmissions).where(eq(gallerySubmissions.galleryId, gallery.id));
    const submittedAt = submissions.reduce<Date | null>((latest, item) => item.completedAt && (!latest || item.completedAt > latest) ? item.completedAt : latest, null);
    const finalizedAt = submittedAt ?? (gallery.status === 'completed' ? selectedPhotos.reduce<Date | null>((latest, photo) => !latest || photo.selectedAt > latest ? photo.selectedAt : latest, null) : null);
    return {
      ...gallery,
      photoCount: galleryPhotos.length,
      selectionCount: uniquePhotos.length,
      clientIds: linkedClients.map((client) => client.id),
      clients: linkedClients.map((client) => ({ ...client, hasAccess: Boolean(client.login) })),
      clientName: linkedClients.map((client) => client.name).join(', ') || gallery.clientName,
      clientEmail: linkedClients[0]?.email ?? null,
      selectionFinalizedAt: finalizedAt,
      selectionMessage: submissions.map((item) => item.message).filter(Boolean).join('\n') || selectedPhotos.find((photo) => photo.comment)?.comment || null,
      selectedPhotos: uniquePhotos.map((photo) => ({ id: photo.id, filename: photo.filename, src: `/fotos/api/gallery/${gallery.slug}/photos/${photo.id}`, comment: comments.filter((comment) => comment.photoId === photo.id).map((comment) => comment.comment).join('\n') })),
      coverUrl: coverPhoto ? `/fotos/api/gallery/${gallery.slug}/photos/${coverPhoto.id}` : null,
    };
  }));
  return NextResponse.json({ galleries: enriched });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string; clientId?: string; clientIds?: string[]; projectType?: 'selection' | 'delivery' | 'album'; category?: string; eventDate?: string; deadline?: string; watermarkEnabled?: boolean } | null;
  if (!body || typeof body.name !== 'string' || typeof body.deadline !== 'string' || (body.clientIds !== undefined && (!Array.isArray(body.clientIds) || !body.clientIds.every((id) => typeof id === 'string'))) || (body.clientId !== undefined && typeof body.clientId !== 'string') || (body.category !== undefined && typeof body.category !== 'string') || (body.eventDate !== undefined && typeof body.eventDate !== 'string') || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline) || Number.isNaN(new Date(body.deadline).getTime())) return NextResponse.json({ error: 'Informe nome, clientes e prazo válidos.' }, { status: 400 });
  const name = body.name?.trim();
  const clientIds = [...new Set((body.clientIds?.length ? body.clientIds : body.clientId ? [body.clientId] : []).filter(Boolean))];
  if (!name || !clientIds.length || !body.deadline) return NextResponse.json({ error: 'Preencha os campos obrigatórios.' }, { status: 400 });
  const linkedClients = await getDb().select().from(clients).where(and(eq(clients.ownerId, user.userId), inArray(clients.id, clientIds)));
  if (linkedClients.length !== clientIds.length) return NextResponse.json({ error: 'Selecione apenas clientes cadastrados na sua conta.' }, { status: 400 });
  const linkedClient = linkedClients.find((client) => client.id === clientIds[0])!;
  const id = crypto.randomUUID();
  const slugBase = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 55) || 'galeria';
  const gallery = { id, ownerId: user.userId, clientId: linkedClient.id, slug: `${slugBase}-${id.slice(0, 6)}`, name: name.slice(0, 120), clientName: linkedClient.name.slice(0, 100), projectType: body.projectType === 'delivery' || body.projectType === 'album' ? body.projectType : 'selection' as const, category: body.category?.trim().slice(0, 50) || 'Ensaio', eventDate: body.eventDate || null, deadline: body.deadline, status: 'draft' as const, watermarkEnabled: false, createdAt: new Date() };
  const db = getDb();
  await db.batch([db.insert(galleries).values(gallery), db.insert(galleryClients).values(clientIds.map((clientId) => ({ id: crypto.randomUUID(), galleryId: id, clientId, createdAt: new Date() })))]);
  return NextResponse.json({ gallery: { ...gallery, clientIds, clients: linkedClients.map(({ id: clientId, name: clientName, email }) => ({ id: clientId, name: clientName, email })) } }, { status: 201 });
}
