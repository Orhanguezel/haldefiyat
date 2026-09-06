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
    expect(validateListingImage({ name: "telefon.heic", size: 100, type: "image/heic" }))
      .toBe("telefon.heic: Yalnızca JPG, PNG veya WebP görseller yüklenebilir.");
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
