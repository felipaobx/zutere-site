import { sameOrigin } from '@/lib/login-security';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { clientCredentials, clients } from '@/db/schema';
import { hashPassword } from '@/lib/credentials';

export async function PUT(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const { clientId } = await params;
  const client = await getDb().select().from(clients).where(and(eq(clients.id, clientId), eq(clients.ownerId, user.userId))).get();
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
  const body = await request.json().catch(() => null) as { login?: string; password?: string } | null;
  if (!body || typeof body.login !== 'string' || typeof body.password !== 'string' || body.password.length > 512) return NextResponse.json({ error: 'Informe login e senha válidos.' }, { status: 400 });
  const login = body.login?.trim().toLowerCase();
  const password = body.password ?? '';
  if (!login || login.length < 4 || !/^[a-z0-9._-]+$/.test(login)) return NextResponse.json({ error: 'Use um login com pelo menos 4 caracteres, sem espaços.' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 });
  const occupied = await getDb().select({ clientId: clientCredentials.clientId }).from(clientCredentials).where(eq(clientCredentials.login, login)).get();
  if (occupied && occupied.clientId !== clientId) return NextResponse.json({ error: 'Este login já está em uso. Escolha outro.' }, { status: 409 });
  const { hash, salt } = await hashPassword(password);
  const now = new Date();
  await getDb().insert(clientCredentials).values({ id: crypto.randomUUID(), clientId, login, passwordHash: hash, salt, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: clientCredentials.clientId, set: { login, passwordHash: hash, salt, updatedAt: now } });
  return NextResponse.json({ ok: true, login });
}
