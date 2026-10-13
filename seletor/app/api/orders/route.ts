import { sameOrigin } from '@/lib/login-security';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { clients, orders } from '@/db/schema';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const rows = await getDb().select({ order: orders, client: clients.name }).from(orders).leftJoin(clients, eq(orders.clientId, clients.id)).where(eq(orders.ownerId, user.userId)).orderBy(desc(orders.createdAt));
  return NextResponse.json({ orders: rows.map(({ order, client }) => ({ ...order, client: client ?? 'Cliente não vinculado' })) });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { clientId?: string; description?: string; amountCents?: number; dueAt?: string } | null;
  if (!body || typeof body.description !== 'string' || !body.description.trim() || typeof body.clientId !== 'string' || !Number.isSafeInteger(body.amountCents) || body.amountCents! < 0 || body.amountCents! > 100000000) return NextResponse.json({ error: 'Informe cliente, descrição e valor válido.' }, { status: 400 });
  const client = await getDb().select().from(clients).where(and(eq(clients.id, body.clientId), eq(clients.ownerId, user.userId))).get();
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
  const dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: 'Prazo inválido.' }, { status: 400 });
  const order = { id: crypto.randomUUID(), ownerId: user.userId, clientId: client.id, description: body.description.trim().slice(0, 300), amountCents: body.amountCents!, status: 'pending' as const, dueAt, createdAt: new Date() };
  await getDb().insert(orders).values(order);
  return NextResponse.json({ order: { ...order, client: client.name } }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; status?: 'pending' | 'paid' | 'production' | 'completed' | 'cancelled' } | null;
  if (!body?.id || !body.status || !['pending', 'paid', 'production', 'completed', 'cancelled'].includes(body.status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  const row = await getDb().update(orders).set({ status: body.status }).where(and(eq(orders.id, body.id), eq(orders.ownerId, user.userId))).returning({ id: orders.id }).get();
  return row ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
}
