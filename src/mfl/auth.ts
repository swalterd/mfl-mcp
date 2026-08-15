import type { AppConfig } from "../config.js";
import type { DiskCache } from "./cache.js";

const COOKIE_CACHE_KEY = "auth_cookie";
const COOKIE_TTL_MS = 1000 * 60 * 60 * 12;

function extractCookieValue(setCookieHeaders: string[]): string | null {
  for (const header of setCookieHeaders) {
    const match = header.match(/MFL_USER_ID=([^;]+)/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractCookieFromXml(body: string): string | null {
  const attrMatch = body.match(/MFL_USER_ID=["']([^"']+)["']/i);
  if (attrMatch?.[1]) return attrMatch[1];
  const tagMatch = body.match(/<MFL_USER_ID>([^<]+)<\/MFL_USER_ID>/i);
  if (tagMatch?.[1]) return tagMatch[1];
  return null;
}

export async function getAuthCookie(
  config: AppConfig,
  cache: DiskCache,
): Promise<string | null> {
  const cached = await cache.get<string>(COOKIE_CACHE_KEY);
  if (cached) return cached;

  if (!config.username || !config.password) return null;

  const response = await fetch(
    `https://api.myfantasyleague.com/${config.year}/login`,
    {
      method: "POST",
      body: new URLSearchParams({
        USERNAME: config.username,
        PASSWORD: config.password,
        XML: "1",
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": config.userAgent,
      },
    },
  );

  const body = await response.text();
  if (/<error>/i.test(body)) {
    const message =
      body.match(/<error>([^<]+)<\/error>/i)?.[1] ?? "Login failed";
    throw new Error(`MFL login failed: ${message}`);
  }

  const setCookie =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter((v): v is string =>
          Boolean(v),
        );

  const cookie =
    extractCookieValue(setCookie) ?? extractCookieFromXml(body) ?? null;

  if (!cookie) {
    throw new Error(
      "MFL login succeeded but no MFL_USER_ID cookie was returned. Check credentials/year.",
    );
  }

  await cache.set(COOKIE_CACHE_KEY, cookie, COOKIE_TTL_MS);
  return cookie;
}

export function missingAuthMessage(): string {
  return (
    "This league endpoint requires auth. Set MFL_USERNAME and MFL_PASSWORD " +
    "(or MFL_APIKEY for read-only) in your Claude/Cursor MCP env config, then restart the client."
  );
}
