import { sameOrigin } from '@/lib/login-security';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { clientCredentials, clients } from '@/db/schema';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const items = await getDb().select({ client: clients, login: clientCredentials.login }).from(clients).leftJoin(clientCredentials, eq(clientCredentials.clientId, clients.id)).where(eq(clients.ownerId, user.userId)).orderBy(desc(clients.createdAt));
  return NextResponse.json({ clients: items.map(({ client, login }) => ({ ...client, login, hasAccess: Boolean(login) })) });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string; email?: string; phone?: string; country?: string; language?: string; notes?: string } | null;
  if (!body || typeof body.name !== 'string' || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) || ['phone', 'country', 'language', 'notes'].some((key) => key in body && typeof body[key as keyof typeof body] !== 'string')) return NextResponse.json({ error: 'Informe nome e e-mail válidos.' }, { status: 400 });
  const name = body.name?.trim(); const email = body.email?.trim().toLowerCase();
  if (!name || !email) return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
  const client = { id: crypto.randomUUID(), ownerId: user.userId, name: name.slice(0, 120), email: email.slice(0, 180), phone: body.phone?.trim().slice(0, 30) || null, country: body.country?.trim().slice(0, 50) || 'Brasil (+55)', language: body.language?.trim().slice(0, 50) || 'Português (BR)', notes: body.notes?.trim().slice(0, 300) || null, createdAt: new Date() };
  await getDb().insert(clients).values(client).onConflictDoUpdate({ target: [clients.ownerId, clients.email], set: { name: client.name, phone: client.phone, country: client.country, language: client.language, notes: client.notes } });
  const saved = await getDb().select().from(clients).where(eq(clients.ownerId, user.userId)).orderBy(desc(clients.createdAt));
  return NextResponse.json({ client: saved.find((item) => item.email === client.email) ?? client }, { status: 201 });
}
