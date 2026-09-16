import { describe, expect, it } from "bun:test";
import { createMarketfiyatiSearch } from "../src/modules/etl/market-scrapers/marketfiyati-search";

describe("marketfiyati search recovery", () => {
  it("recovers from a connection reset with a bounded delay and counts actual calls", async () => {
    let calls = 0;
    const delays: number[] = [];
    const search = createMarketfiyatiSearch({
      fetch: async () => {
        if (++calls === 1) throw Object.assign(new Error("reset"), { code: "ECONNRESET" });
        return Response.json({ content: [{ id: "offer" }] });
      },
      sleep: async (ms) => { delays.push(ms); },
    });
    expect(await search("domates", 0)).toEqual({ data: { content: [{ id: "offer" }] }, throttled: false, calls: 2 });
    expect(delays).toEqual([2_000]);
    await search("biber", 0);
    expect(delays).toEqual([2_000, 1_100]);
  });
  it.each([403, 429])("stops on source throttling %s without retrying", async (status) => {
    let calls = 0;
    const search = createMarketfiyatiSearch({ fetch: async () => { calls++; return new Response("limited", { status }); } });
    expect(await search("domates", 0)).toEqual({ data: null, calls: 1, throttled: true, error: `SEARCH_HTTP_${status}` });
    expect(calls).toBe(1);
  });
  it("reports persistent upstream failure instead of inventing an empty result", async () => {
    const search = createMarketfiyatiSearch({ fetch: async () => new Response("unavailable", { status: 503 }), sleep: async () => {} });
    expect(await search("domates", 0)).toEqual({ data: null, calls: 3, throttled: false, error: "SEARCH_HTTP_503", unavailable: true });
  });
  it("recognizes nested network errors and does not retry successful empty searches", async () => {
    const fail = createMarketfiyatiSearch({ fetch: async () => { throw new TypeError("fetch failed", { cause: { code: "ECONNRESET" } }); }, sleep: async () => {} });
    expect((await fail("biber", 0)).error).toBe("SEARCH_ECONNRESET_ERROR");
    const empty = createMarketfiyatiSearch({ fetch: async () => Response.json({ content: [] }) });
    expect(await empty("mangostan", 0)).toEqual({ data: { content: [] }, calls: 1, throttled: false });
  });
});
