import { afterEach, describe, expect, test, vi } from "vitest";
import { trackAdConversion } from "./ad-conversions";

afterEach(() => vi.unstubAllGlobals());

describe("reklam dönüşüm ilişkilendirmesi", () => {
  test("ilan iletişim dönüşümünü attribution endpointine yollar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    trackAdConversion("offer_submit", "listing", 42);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/banners/conversion", expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ eventType: "offer_submit", entityType: "listing", entityId: "42" }),
    }));
  });
});
