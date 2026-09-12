import { describe, expect, it } from "vitest";
import {
  listingImageUploadError,
  MAX_LISTING_IMAGE_BYTES,
  validateListingImage,
} from "./listing-image-upload";

describe("listing image upload feedback", () => {
  it("rejects oversized and unsupported files before upload", () => {
    expect(validateListingImage({ name: "buyuk.jpg", size: MAX_LISTING_IMAGE_BYTES + 1, type: "image/jpeg" }))
      .toBe("buyuk.jpg: Görsel 5 MB sınırını aşıyor.");
    expect(validateListingImage({ name: "belge.pdf", size: 100, type: "application/pdf" }))
      .toBe("belge.pdf: Yalnızca JPG, PNG veya WebP görseller yüklenebilir.");
  });

  it("tells HEIC users what to change instead of a dead end", () => {
    // iPhone varsayilan olarak HEIC uretir. Tarayici cozebiliyorsa prepareListingImage
    // JPEG'e cevirir ve buraya hic gelmez; gelmisse cozulememistir, mesaj eylem onermeli.
    const message = validateListingImage({ name: "telefon.heic", size: 100, type: "image/heic" });
    expect(message).toContain("HEIC");
    expect(message).toContain("En Uyumlu");
  });

  it("passes small supported images through untouched", async () => {
    const { prepareListingImage } = await import("./listing-image-upload");
    const file = new File(["kucuk"], "ayva.jpg", { type: "image/jpeg" });
    expect(await prepareListingImage(file)).toBe(file);
  });

  it("keeps the original file when the browser cannot decode it", async () => {
    const { prepareListingImage } = await import("./listing-image-upload");
    // 6 MB'lik HEIC: cozulemezse orijinal geri doner, karari validate verir.
    const file = new File([new Uint8Array(6 * 1024 * 1024)], "telefon.heic", { type: "image/heic" });
    expect(await prepareListingImage(file)).toBe(file);
  });

  it("turns proxy and API failures into visible Turkish messages", () => {
    expect(listingImageUploadError("fasulye.jpg", 413, {}))
      .toBe("fasulye.jpg: Görsel 5 MB sınırını aşıyor.");
    expect(listingImageUploadError("fasulye.jpg", 422, { error: { code: "invalid_image" } }))
      .toBe("fasulye.jpg: Görsel dosyası okunamadı. Başka bir görsel deneyin.");
    expect(listingImageUploadError("fasulye.jpg", null, {}))
      .toBe("fasulye.jpg: Görsel yüklenemedi. Lütfen tekrar deneyin.");
  });
});

it("refreshes expired authentication and retries the same multipart image", async () => {
  const { vi } = await import("vitest");
  const { uploadListingImage } = await import("./listing-image-upload");
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ access_token: "renewed-test-token" }) })
    .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ url: "/uploads/listings/test.webp" }) });
  vi.stubGlobal("fetch", fetchMock);
  try {
    expect(await uploadListingImage(new File(["image"], "test.jpg", { type: "image/jpeg" }))).toBe("/uploads/listings/test.webp");
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/token/refresh");
    expect(fetchMock.mock.calls[2][1].body).toBe(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[2][1].headers).not.toHaveProperty("Content-Type");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer renewed-test-token");
  } finally { vi.unstubAllGlobals(); localStorage.clear(); }
});
