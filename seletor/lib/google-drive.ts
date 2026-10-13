import { env } from 'cloudflare:workers';
import { seal, unseal } from './drive-crypto';
export const DRIVE_REDIRECT_URI = 'https://www.zutere.com.br/fotos/api/drive/callback';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const DRIVE_PHOTO_BYTES = 20 * 1024 * 1024;
type Configuration = { client_id: string; secret_cipher: string };
type Connection = { owner_id: string; google_subject: string; email: string; folder_id: string; tokens_cipher: string };
type Tokens = { refreshToken: string; accessToken: string; expiresAt: number };
export class DriveError extends Error { constructor(message: string, public status = 502) { super(message); } }
export async function driveConfig(ownerId: string) { return env.DB.prepare('SELECT client_id,secret_cipher FROM drive_configs WHERE owner_id=?').bind(ownerId).first<Configuration>(); }
export async function driveConnection(ownerId: string) { return env.DB.prepare('SELECT * FROM drive_connections WHERE owner_id=?').bind(ownerId).first<Connection>(); }
export async function getDriveStatus(ownerId: string) {
  const [config, connection] = await Promise.all([driveConfig(ownerId), driveConnection(ownerId)]);
  return { configured: Boolean(config), connected: Boolean(connection), encryptionReady: Boolean(env.DRIVE_ENCRYPTION_KEY), clientId: config?.client_id ?? '', email: connection?.email ?? '', folderUrl: connection ? 'https://drive.google.com/drive/folders/' + connection.folder_id : null, redirectUri: DRIVE_REDIRECT_URI, maxPhotoBytes: connection ? DRIVE_PHOTO_BYTES : 1_000_000 };
}
export async function exchangeToken(parameters: URLSearchParams) {
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: parameters });
  if (!response.ok) throw new DriveError('O Google não autorizou a conexão. Confira as credenciais e conecte novamente.', 409);
  return response.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>;
}
export async function driveToken(ownerId: string) {
  const [connection, config] = await Promise.all([driveConnection(ownerId), driveConfig(ownerId)]);
  if (!connection || !config) throw new DriveError('Conecte novamente o Google Drive nas configurações para acessar estas fotos.', 409);
  const tokens = JSON.parse(await unseal(connection.tokens_cipher, env.DRIVE_ENCRYPTION_KEY, 'tokens:' + ownerId)) as Tokens;
  if (tokens.expiresAt > Date.now() + 60_000) return { token: tokens.accessToken, folderId: connection.folder_id };
  const clientSecret = await unseal(config.secret_cipher, env.DRIVE_ENCRYPTION_KEY, 'client:' + ownerId);
  const refreshed = await exchangeToken(new URLSearchParams({ client_id: config.client_id, client_secret: clientSecret, refresh_token: tokens.refreshToken, grant_type: 'refresh_token' }));
  const cipher = await seal(JSON.stringify({ refreshToken: refreshed.refresh_token ?? tokens.refreshToken, accessToken: refreshed.access_token, expiresAt: Date.now() + refreshed.expires_in * 1000 }), env.DRIVE_ENCRYPTION_KEY, 'tokens:' + ownerId);
  await env.DB.prepare('UPDATE drive_connections SET tokens_cipher=?,updated_at=? WHERE owner_id=? AND google_subject=?').bind(cipher, Date.now(), ownerId, connection.google_subject).run();
  return { token: refreshed.access_token, folderId: connection.folder_id };
}
export async function googleRequest(url: string, token: string, init: RequestInit = {}) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'www.googleapis.com') throw new DriveError('Endereço de armazenamento inválido.');
  const headers = new Headers(init.headers); headers.set('Authorization', 'Bearer ' + token);
  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) throw new DriveError('A autorização do Google Drive expirou. Reconecte nas configurações.', 409);
  if (response.status === 403) throw new DriveError('O Google Drive não permitiu esta operação. Confira o espaço disponível e a autorização.', 403);
  if (response.status === 429) throw new DriveError('O Google Drive atingiu um limite temporário. Tente novamente em alguns minutos.', 429);
  if (!response.ok && response.status !== 404) throw new DriveError('O Google Drive não respondeu. Tente novamente.');
  return response;
}
export async function putDriveFile(ownerId: string, storageKey: string, stream: ReadableStream<Uint8Array>, contentType: string, filename: string, size: number) {
  const { token, folderId } = await driveToken(ownerId);
  const galleryId = storageKey.split('/')[1];
  let folder = await env.DB.prepare('SELECT remote_folder_id FROM drive_gallery_folders WHERE gallery_id=? AND owner_id=?').bind(galleryId, ownerId).first<{ remote_folder_id: string }>();
  if (!folder) {
    const created = await googleRequest('https://www.googleapis.com/drive/v3/files?fields=id', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Galeria ' + galleryId, mimeType: 'application/vnd.google-apps.folder', parents: [folderId] }) });
    const newFolder = await created.json() as { id: string };
    await env.DB.prepare('INSERT OR IGNORE INTO drive_gallery_folders(gallery_id,owner_id,remote_folder_id) VALUES (?,?,?)').bind(galleryId, ownerId, newFolder.id).run();
    folder = await env.DB.prepare('SELECT remote_folder_id FROM drive_gallery_folders WHERE gallery_id=? AND owner_id=?').bind(galleryId, ownerId).first<{ remote_folder_id: string }>();
    if (folder?.remote_folder_id !== newFolder.id) await googleRequest('https://www.googleapis.com/drive/v3/files/' + newFolder.id, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });
  }
  if (!folder) throw new DriveError('Não foi possível criar a pasta da galeria.');
  const start = await googleRequest('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', token, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': contentType, 'X-Upload-Content-Length': String(size) }, body: JSON.stringify({ name: filename, parents: [folder.remote_folder_id] }) });
  const location = start.headers.get('location'); if (!location) throw new DriveError('Não foi possível iniciar o envio ao Drive.');
  const uploaded = await googleRequest(location, token, { method: 'PUT', headers: { 'Content-Type': contentType, 'Content-Length': String(size) }, body: stream });
  const file = await uploaded.json() as { id: string }; if (!/^[\w-]+$/.test(file.id)) throw new DriveError('Resposta de armazenamento inválida.');
  try {
    await env.DB.prepare('INSERT INTO drive_files(storage_key,owner_id,remote_file_id,content_type,size,created_at) VALUES (?,?,?,?,?,?)').bind(storageKey, ownerId, file.id, contentType, size, Date.now()).run();
  } catch (error) {
    await googleRequest('https://www.googleapis.com/drive/v3/files/' + file.id, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });
    throw error;
  }
}
