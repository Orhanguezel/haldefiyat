import { afterEach, describe, expect, it } from "bun:test";

const original = globalThis.fetch;
afterEach(() => { globalThis.fetch = original; });

/** repository.ts'teki linkReachable ile ayni sozlesme — davranisi burada sabitlenir. */
async function linkReachable(url: string): Promise<boolean> {
  const attempt = async (method: "HEAD" | "GET"): Promise<number | null> => {
    try {
      const response = await fetch(url, {
        method, redirect: "follow",
        headers: { "user-agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)", accept: "*/*" },
        signal: AbortSignal.timeout(12_000),
      });
      return response.status;
    } catch { return null; }
  };
  for (let round = 0; round < 2; round += 1) {
    const head = await attempt("HEAD");
    if (head != null && head < 400) return true;
    const get = await attempt("GET");
    if (get != null && get < 400) return true;
    if (round === 0) await new Promise((resolve) => setTimeout(resolve, 5));
  }
  return false;
}

describe("reklam hedef adresi denetimi", () => {
  it("HEAD 405 verse de GET 200 ise adres saglam sayilir", async () => {
    globalThis.fetch = (async (_u: unknown, init?: { method?: string }) =>
      new Response(null, { status: init?.method === "HEAD" ? 405 : 200 })) as typeof fetch;
    expect(await linkReachable("https://ornek.test")).toBe(true);
  });

  it("anlik kesinti reklami oldurmez — ikinci turda toparlarsa saglam", async () => {
    let call = 0;
    globalThis.fetch = (async () => {
      call += 1;
      if (call <= 2) throw new Error("timeout");
      return new Response(null, { status: 200 });
    }) as typeof fetch;
    expect(await linkReachable("https://ornek.test")).toBe(true);
  });

  it("gercekten olu adres iki turda da dusuyorsa sorunlu isaretlenir", async () => {
    globalThis.fetch = (async () => new Response(null, { status: 404 })) as typeof fetch;
    expect(await linkReachable("https://ornek.test")).toBe(false);
  });
});
