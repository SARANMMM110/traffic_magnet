export type WordPressConnectErrorCode =
  | "INVALID_URL"
  | "REST_UNREACHABLE"
  | "REST_NOT_JSON"
  | "REST_DISABLED"
  | "AUTH_FAILED"
  | "FORBIDDEN"
  | "NO_PUBLISH_CAPABILITY"
  | "TIMEOUT"
  | "NETWORK"
  | "SSL_ERROR"
  | "UNKNOWN";

export interface WordPressConnectOk {
  ok: true;
  baseUrl: string;
  domain: string;
  wpUser: { id: number; name: string; slug: string };
  publishingAccess: boolean;
  restApiReachable: boolean;
  wpVersion: string | null;
}

export interface WordPressConnectErr {
  ok: false;
  code: WordPressConnectErrorCode;
  message: string;
  detail?: string;
}

export type WordPressConnectResult = WordPressConnectOk | WordPressConnectErr;

function normalizeApplicationPassword(raw: string): string {
  return raw.replace(/\s+/g, "").trim();
}

/** Build WordPress home + REST base (supports subdirectory installs). */
export function normalizeWordPressBaseUrl(input: string): { baseUrl: string; domain: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;
  let path = url.pathname;
  if (path.endsWith("/")) path = path.slice(0, -1);
  const baseUrl = `${url.origin}${path}`;
  const domain = url.hostname.replace(/^www\./, "");
  return { baseUrl, domain };
}

function basicAuthHeader(username: string, applicationPassword: string): string {
  const token = `${username}:${normalizeApplicationPassword(applicationPassword)}`;
  const b64 = btoa(unescape(encodeURIComponent(token)));
  return `Basic ${b64}`;
}

function mapFetchError(e: unknown): WordPressConnectErr {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (lower.includes("abort") || lower.includes("timeout")) {
    return { ok: false, code: "TIMEOUT", message: "Connection timed out", detail: msg };
  }
  if (lower.includes("certificate") || lower.includes("ssl") || lower.includes("tls")) {
    return { ok: false, code: "SSL_ERROR", message: "SSL/TLS error — check your certificate", detail: msg };
  }
  return { ok: false, code: "NETWORK", message: "Could not reach the site", detail: msg };
}

function hasPublishCapability(capabilities: Record<string, boolean> | undefined): boolean {
  if (!capabilities) return false;
  return Boolean(
    capabilities.publish_posts ||
      capabilities.edit_published_posts ||
      capabilities.edit_posts,
  );
}

/**
 * Validates REST and application password via GET /wp-json/wp/v2/users/me
 */
export async function testWordPressApplicationPassword(params: {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}): Promise<WordPressConnectResult> {
  const parsed = normalizeWordPressBaseUrl(params.siteUrl);
  if (!parsed) {
    return {
      ok: false,
      code: "INVALID_URL",
      message: "Enter a valid site URL (e.g. https://yoursite.com)",
    };
  }

  const { baseUrl, domain } = parsed;
  const meUrl = `${baseUrl}/wp-json/wp/v2/users/me`;
  const auth = basicAuthHeader(params.username, params.applicationPassword);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(meUrl, {
      method: "GET",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    const rawText = await res.text();
    let json: Record<string, unknown> | null = null;
    if (contentType.includes("application/json")) {
      try {
        json = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        json = null;
      }
    } else {
      try {
        json = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        json = null;
      }
    }

    if (!json && rawText.trim().startsWith("<")) {
      return {
        ok: false,
        code: "REST_NOT_JSON",
        message: "The site did not return JSON — REST API may be blocked or cached HTML returned",
      };
    }

    if (res.status === 401) {
      return {
        ok: false,
        code: "AUTH_FAILED",
        message: "Authentication failed — check username and application password",
      };
    }

    if (res.status === 403) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Access forbidden (403) — REST API or application passwords may be disabled",
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        code: "REST_DISABLED",
        message: "WordPress REST endpoint not found — permalinks or REST may be disabled",
      };
    }

    if (!res.ok || !json) {
      return {
        ok: false,
        code: "REST_UNREACHABLE",
        message: `Unexpected response (${res.status}) from WordPress`,
        detail: rawText.slice(0, 200),
      };
    }

    const id = Number(json.id);
    const name = typeof json.name === "string" ? json.name : "";
    const slug = typeof json.slug === "string" ? json.slug : "";
    if (!Number.isFinite(id)) {
      return {
        ok: false,
        code: "REST_NOT_JSON",
        message: "Unexpected response from WordPress REST API",
      };
    }

    const capabilities = json.capabilities as Record<string, boolean> | undefined;
    const publishingAccess = hasPublishCapability(capabilities);

    const wpVersion = res.headers.get("x-wp-version");

    return {
      ok: true,
      baseUrl,
      domain,
      wpUser: { id, name: name || slug || `User ${id}`, slug },
      publishingAccess,
      restApiReachable: true,
      wpVersion,
    };
  } catch (e) {
    clearTimeout(timeout);
    if ((e as Error)?.name === "AbortError") {
      return { ok: false, code: "TIMEOUT", message: "Connection timed out" };
    }
    return mapFetchError(e);
  }
}
