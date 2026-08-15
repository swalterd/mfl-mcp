import { describe, expect, it } from "vitest";

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

describe("auth cookie parsing", () => {
  it("reads Set-Cookie MFL_USER_ID", () => {
    expect(
      extractCookieValue([
        "MFL_USER_ID=abc+/=; Path=/; HttpOnly",
        "MFL_PW_SEQ=1; Path=/",
      ]),
    ).toBe("abc+/=");
  });

  it("reads XML attribute cookie", () => {
    expect(
      extractCookieFromXml('<status MFL_USER_ID="cookieValue123" />'),
    ).toBe("cookieValue123");
  });
});
