import { sameOrigin } from '@/lib/login-security';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { galleries, galleryCredentials } from '@/db/schema';
import { hashPassword, temporaryPassword } from '@/lib/credentials';

export async function POST(request: Request, { params }: { params: Promise<{ galleryId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { galleryId } = await params; const db = getDb();
  const gallery = await db.select().from(galleries).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId))).get();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  const password = temporaryPassword(); const { hash, salt } = await hashPassword(password); const now = new Date();
  const loginBase = gallery.clientName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '').slice(0, 35) || 'cliente';
  const login = `${loginBase}.${gallery.id.slice(0, 4)}`;
  await db.insert(galleryCredentials).values({ id: crypto.randomUUID(), galleryId, login, passwordHash: hash, salt, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: galleryCredentials.galleryId, set: { login, passwordHash: hash, salt, updatedAt: now } });
  if (gallery.status === 'draft') {
    await db.update(galleries).set({ status: 'selecting' }).where(and(eq(galleries.id, galleryId), eq(galleries.ownerId, user.userId)));
  }
  return NextResponse.json({ login, password, path: `/fotos/cliente/${gallery.slug}` });
}

