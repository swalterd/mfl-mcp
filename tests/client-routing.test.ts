import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { DiskCache } from "../src/mfl/cache.js";
import { MflClient } from "../src/mfl/client.js";

const calls: string[] = [];
const server = setupServer(
  http.get("https://api.myfantasyleague.com/2026/export", ({ request }) => {
    calls.push(request.url);
    return HttpResponse.json({ player_ranks: { player: [] } });
  }),
  http.get("https://www99.myfantasyleague.com/2026/export", ({ request }) => {
    calls.push(request.url);
    return HttpResponse.json({
      league: {
        id: "99999",
        baseURL: "https://www99.myfantasyleague.com",
      },
    });
  }),
);

describe("MFL client routing", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    calls.length = 0;
    server.resetHandlers();
  });
  afterAll(() => server.close());

  it("routes global requests to api host", async () => {
    const client = new MflClient(
      {
        year: "2026",
        leagueId: "99999",
        host: "www99.myfantasyleague.com",
        userAgent: "test",
        cacheDir: ".cache/test",
        readOnly: false,
      },
      new DiskCache(".cache/test"),
    );
    await client.export("playerRanks");
    expect(calls[0]).toContain("api.myfantasyleague.com");
  });

  it("routes league requests to configured league host", async () => {
    const client = new MflClient(
      {
        year: "2026",
        leagueId: "99999",
        host: "www99.myfantasyleague.com",
        userAgent: "test",
        cacheDir: ".cache/test2",
        readOnly: false,
      },
      new DiskCache(".cache/test2"),
    );
    await client.export("league");
    expect(calls[0]).toContain("www99.myfantasyleague.com");
  });
});
