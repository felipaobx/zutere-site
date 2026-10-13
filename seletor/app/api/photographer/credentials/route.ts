import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { photographers, photographerSessions } from '@/db/schema';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { hashPassword, verifyPassword } from '@/lib/credentials';
import { allowLogin, sameOrigin } from '@/lib/login-security';

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Entre na sua conta para alterar o acesso.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { email?: unknown; currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown } | null;
  if (!body || typeof body.email !== 'string' || typeof body.currentPassword !== 'string' || !body.currentPassword || body.currentPassword.length > 512 || body.email.length > 254 || (body.newPassword !== undefined && typeof body.newPassword !== 'string') || (body.confirmPassword !== undefined && typeof body.confirmPassword !== 'string')) return NextResponse.json({ error: 'Informe o e-mail de login e sua senha atual.' }, { status: 400 });
  const email = body.email.trim().toLowerCase();
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Informe um e-mail válido para o login.' }, { status: 400 });
  if (newPassword && (newPassword.length < 12 || newPassword.length > 512)) return NextResponse.json({ error: 'A nova senha precisa ter entre 12 e 512 caracteres.' }, { status: 400 });
  if (newPassword !== (body.confirmPassword ?? '')) return NextResponse.json({ error: 'A nova senha e a confirmação precisam ser iguais.' }, { status: 400 });
  if (!await allowLogin('photographer-credentials', user.userId)) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 });
  const db = getDb();
  const account = await db.select().from(photographers).where(eq(photographers.id, user.userId)).get();
  if (!account || !await verifyPassword(body.currentPassword, account.salt, account.passwordHash)) return NextResponse.json({ error: 'A senha atual está incorreta.' }, { status: 403 });
  if (email === account.email && !newPassword) return NextResponse.json({ error: 'Altere o e-mail ou informe uma nova senha.' }, { status: 400 });
  const duplicate = await db.select({ id: photographers.id }).from(photographers).where(eq(photographers.email, email)).get();
  if (duplicate && duplicate.id !== account.id) return NextResponse.json({ error: 'Este e-mail já está sendo usado por outra conta.' }, { status: 409 });
  const password = newPassword ? await hashPassword(newPassword) : { hash: account.passwordHash, salt: account.salt };
  try {
    // A single D1 transaction updates the credentials and revokes every old
    // session. The hash condition prevents stale concurrent password changes.
    const result = await db.batch([
      db.update(photographers).set({ email, passwordHash: password.hash, salt: password.salt }).where(and(eq(photographers.id, user.userId), eq(photographers.passwordHash, account.passwordHash), eq(photographers.salt, account.salt), eq(photographers.email, account.email))).returning({ id: photographers.id }),
      db.delete(photographerSessions).where(eq(photographerSessions.photographerId, user.userId)),
    ]);
    if (!result[0].length) return NextResponse.json({ error: 'Sua conta mudou em outra sessão. Entre novamente para continuar.' }, { status: 409 });
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint/i.test(error.message + String(error.cause))) return NextResponse.json({ error: 'Este e-mail já está sendo usado por outra conta.' }, { status: 409 });
    throw error;
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set('zutere_photographer', '', { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 0 });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
