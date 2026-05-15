const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function fromB64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveAesKey(masterSecret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(masterSecret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypt application password for D1 storage (server-only). */
export async function encryptApplicationPassword(
  plaintext: string,
  masterSecret: string,
): Promise<string> {
  const key = await deriveAesKey(masterSecret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  return JSON.stringify({
    v: 1,
    iv: toB64(iv.buffer),
    ct: toB64(ciphertext),
  });
}

export async function decryptApplicationPassword(
  payloadJson: string,
  masterSecret: string,
): Promise<string> {
  const { iv: ivB64, ct: ctB64 } = JSON.parse(payloadJson) as { v?: number; iv: string; ct: string };
  if (!ivB64 || !ctB64) throw new Error("Invalid credential payload");
  const key = await deriveAesKey(masterSecret);
  const iv = fromB64(ivB64);
  const ct = fromB64(ctB64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(plain);
}

export function getWordPressCredentialSecret(env: {
  WORDPRESS_CREDENTIALS_SECRET?: string;
  MOCHA_USERS_SERVICE_API_KEY?: string;
}): string {
  const explicit = env.WORDPRESS_CREDENTIALS_SECRET?.trim();
  if (explicit && explicit.length >= 16) return explicit;
  const fallback = env.MOCHA_USERS_SERVICE_API_KEY?.trim();
  if (fallback && fallback.length >= 8) return `${fallback}:magnet-wp-creds-v1`;
  throw new Error("WORDPRESS_CREDENTIALS_SECRET or MOCHA_USERS_SERVICE_API_KEY must be configured");
}
