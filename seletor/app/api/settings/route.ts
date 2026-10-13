import { sameOrigin } from '@/lib/login-security';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { accountSettings } from '@/db/schema';

type SettingsInput = { displayName: string; studioName: string; loginEmail: string; primaryColor: string; accentColor: string; appearance: 'light' | 'dark' | 'system'; plan: 'essential' | 'studio' | 'pro' };
const defaults: SettingsInput = { displayName: 'Felipe Costa', studioName: 'Zutere', loginEmail: '', primaryColor: '#6f4cc3', accentColor: '#a95072', appearance: 'light', plan: 'studio' };

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const saved = await getDb().select().from(accountSettings).where(eq(accountSettings.ownerId, user.userId)).get();
  return NextResponse.json({ settings: { ...(saved ? { ...saved, loginEmail: saved.loginEmail ?? '' } : { ...defaults, displayName: user.displayName, ownerId: user.userId }), authenticationEmail: user.email } });
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as Partial<SettingsInput> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body) || ['displayName', 'studioName', 'loginEmail', 'primaryColor', 'accentColor'].some((key) => key in body && typeof body[key as keyof SettingsInput] !== 'string')) return NextResponse.json({ error: 'Configurações inválidas.' }, { status: 400 });
  if (body.loginEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.loginEmail.trim())) return NextResponse.json({ error: 'Informe um e-mail de contato válido.' }, { status: 400 });
  const colorPattern = /^#[0-9a-f]{6}$/i;
  const settings = {
    ownerId: user.userId,
    displayName: body.displayName?.trim().slice(0, 100) || defaults.displayName,
    studioName: body.studioName?.trim().slice(0, 100) || defaults.studioName,
    loginEmail: body.loginEmail?.trim().toLowerCase().slice(0, 180) || null,
    primaryColor: colorPattern.test(body.primaryColor ?? '') ? body.primaryColor! : defaults.primaryColor,
    accentColor: colorPattern.test(body.accentColor ?? '') ? body.accentColor! : defaults.accentColor,
    appearance: body.appearance === 'dark' || body.appearance === 'system' ? body.appearance : 'light' as const,
    plan: body.plan === 'essential' || body.plan === 'pro' ? body.plan : 'studio' as const,
    updatedAt: new Date(),
  };
  await getDb().insert(accountSettings).values(settings).onConflictDoUpdate({ target: accountSettings.ownerId, set: { ...settings } });
  return NextResponse.json({ settings: { ...settings, loginEmail: settings.loginEmail ?? '', authenticationEmail: user.email } });
}
