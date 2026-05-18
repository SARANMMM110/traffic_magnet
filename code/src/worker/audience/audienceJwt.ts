const enc = new TextEncoder();
const dec = new TextDecoder();

function base64UrlEncode(buf: ArrayBuffer | string): string {
  const bytes = typeof buf === "string" ? enc.encode(buf) : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function audienceSignJwt(
  secret: string,
  claims: { sub: number; fid: string; aid?: string },
  maxAgeSec: number,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...claims,
    iat: now,
    exp: now + maxAgeSec,
    iss: "magnet-audience-v1",
  };
  const h = base64UrlEncode(JSON.stringify(header));
  const p = base64UrlEncode(JSON.stringify(payload));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${h}.${p}`));
  return `${h}.${p}.${base64UrlEncode(sig)}`;
}

export async function audienceVerifyJwt(
  secret: string,
  token: string,
): Promise<{ sub: number; fid: string; aid?: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sigB64] = parts;
  try {
    const key = await hmacKey(secret);
    const sig = base64UrlDecode(sigB64);
    const ok = await crypto.subtle.verify("HMAC", key, sig, enc.encode(`${h}.${p}`));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(base64UrlDecode(p))) as Record<string, unknown>;
    if (payload.iss !== "magnet-audience-v1") return null;
    const exp = Number(payload.exp);
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
    const sub = Number(payload.sub);
    const fid = String(payload.fid || "");
    if (!Number.isFinite(sub) || !fid) return null;
    return { sub, fid, aid: payload.aid ? String(payload.aid) : undefined };
  } catch {
    return null;
  }
}

export function getAudienceUnlockSecret(env: {
  AUDIENCE_UNLOCK_SECRET?: string;
  MOCHA_USERS_SERVICE_API_KEY?: string;
}): string {
  const s = env.AUDIENCE_UNLOCK_SECRET?.trim();
  if (s && s.length >= 32) return s;
  const fallback = env.MOCHA_USERS_SERVICE_API_KEY?.trim();
  if (fallback && fallback.length >= 32) return `audience-unlock:${fallback}`;
  throw new Error("AUDIENCE_UNLOCK_SECRET (32+ chars) or MOCHA_USERS_SERVICE_API_KEY is required for audience JWTs.");
}
