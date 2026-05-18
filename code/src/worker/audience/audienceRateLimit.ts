/** Minimal D1 surface for rate limiting (avoids strict workers-types import path). */
export type D1Like = {
  prepare: (query: string) => {
    bind: (...args: (string | number | null)[]) => {
      first: <T = { hit_count: number }>() => Promise<T | null>;
      run: () => Promise<unknown>;
      all: () => Promise<any>;
    };
  };
};

export async function audienceRateLimitHit(
  db: D1Like,
  prefix: string,
  id: string,
  opts: { windowMinutes: number; maxHits: number },
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const key = `${prefix}:${id}:${Math.floor(Date.now() / (opts.windowMinutes * 60_000))}`;
  const expiresAt = new Date(Date.now() + opts.windowMinutes * 60_000 + 120_000).toISOString();
  const now = new Date().toISOString();

  try {
    const row = await db.prepare("SELECT hit_count FROM audience_rate_limits WHERE bucket_key = ? AND expires_at > ?")
      .bind(key, now)
      .first<{ hit_count: number }>();

    const next = (row?.hit_count ?? 0) + 1;
    if (next > opts.maxHits) {
      return { ok: false, retryAfterSec: opts.windowMinutes * 60 };
    }

    await db.prepare(
      `INSERT INTO audience_rate_limits (bucket_key, hit_count, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(bucket_key) DO UPDATE SET hit_count = excluded.hit_count, expires_at = excluded.expires_at`,
    )
      .bind(key, next, expiresAt)
      .run();

    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function hashSessionClient(ip: string | undefined, ua: string | undefined): string {
  const raw = `${ip || "0"}|${ua || ""}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(16)}`;
}
