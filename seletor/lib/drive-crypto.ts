const encoder = new TextEncoder();
export function encodeBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
export function decodeBase64(value: string) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
async function key(secret: string) {
  if (!secret) throw new Error('A conexão com o Drive ainda não foi configurada pelo administrador.');
  const bytes = decodeBase64(secret); if (bytes.length !== 32) throw new Error('Chave de conexão inválida.');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function seal(value: string, secret: string, context: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(context) }, await key(secret), encoder.encode(value));
  return encodeBase64(iv) + '.' + encodeBase64(new Uint8Array(encrypted));
}
export async function unseal(value: string, secret: string, context: string) {
  const parts = value.split('.'); if (parts.length !== 2) throw new Error('Credencial de conexão inválida.');
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase64(parts[0]), additionalData: encoder.encode(context) }, await key(secret), decodeBase64(parts[1]));
  return new TextDecoder().decode(decrypted);
}
