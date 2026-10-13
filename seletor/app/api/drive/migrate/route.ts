import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { sameOrigin } from '@/lib/login-security';
import { driveConnection, putDriveFile, DriveError } from '@/lib/google-drive';
export async function GET() {
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const rows = await env.DB.prepare('SELECT p.id,p.filename FROM photos p JOIN galleries g ON g.id=p.gallery_id JOIN photo_files f ON f.storage_key=p.storage_key WHERE g.owner_id=? ORDER BY p.created_at').bind(user.userId).all<{ id: string; filename: string }>();
  return NextResponse.json({ photos: rows.results }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { photoId?: unknown } | null;
  if (typeof body?.photoId !== 'string' || body.photoId.length > 128) return NextResponse.json({ error: 'Informe a fotografia.' }, { status: 400 });
  const photo = await env.DB.prepare('SELECT p.storage_key,p.filename,p.content_type,p.size FROM photos p JOIN galleries g ON g.id=p.gallery_id WHERE p.id=? AND g.owner_id=?').bind(body.photoId, user.userId).first<{ storage_key: string; filename: string; content_type: string; size: number }>();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  if (!await driveConnection(user.userId)) return NextResponse.json({ error: 'Conecte o Google Drive antes de mover as fotos.' }, { status: 409 });
  try {
    const existing = await env.DB.prepare('SELECT storage_key FROM drive_files WHERE storage_key=? AND owner_id=?').bind(photo.storage_key, user.userId).first();
    if (!existing) {
      const legacy = await env.DB.prepare('SELECT data FROM photo_files WHERE storage_key=?').bind(photo.storage_key).first<{ data: number[] }>();
      if (!legacy) return NextResponse.json({ error: 'Arquivo original não encontrado.' }, { status: 404 });
      const bytes = new Uint8Array(legacy.data);
      await putDriveFile(user.userId, photo.storage_key, new Blob([bytes]).stream(), photo.content_type, photo.filename, photo.size);
    }
    // Only release local storage after the remote file is acknowledged and its
    // reference is committed. Repeating this operation is safe.
    await env.DB.prepare('DELETE FROM photo_files WHERE storage_key=? AND EXISTS (SELECT 1 FROM drive_files WHERE storage_key=? AND owner_id=?)').bind(photo.storage_key, photo.storage_key, user.userId).run();
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof DriveError ? error.message : 'Não foi possível mover a foto. O arquivo original foi preservado.' }, { status: error instanceof DriveError ? error.status : 502 }); }
}
