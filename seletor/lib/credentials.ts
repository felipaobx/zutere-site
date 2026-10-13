const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

export function randomToken(bytes = 24) { const value = new Uint8Array(bytes); crypto.getRandomValues(value); return toBase64Url(value); }
export function temporaryPassword() { return `LUMEA-${randomToken(5).slice(0, 6).toUpperCase()}`; }

export async function hashPassword(password: string, salt = randomToken(16)) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120_000, hash: 'SHA-256' }, material, 256);
  return { hash: toBase64Url(new Uint8Array(bits)), salt };
}

export async function verifyPassword(password: string, salt: string, expected: string) { return (await hashPassword(password, salt)).hash === expected; }
export async function hashToken(token: string) { const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token)); return toBase64Url(new Uint8Array(digest)); }
