import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { secureImageUploadForTest } from "@/modules/storage/secure-storage";

describe("secure image upload pipeline", () => {
  test("sniffs the real format, strips metadata and emits bounded WebP", async () => {
    const input = await sharp({
      create: { width: 24, height: 16, channels: 3, background: "#1d8a55" },
    })
      .withMetadata({ exif: { IFD0: { Artist: "private author" } } })
      .jpeg()
      .toBuffer();

    const output = await secureImageUploadForTest(input, "image/jpeg", 1024 * 1024);
    const metadata = await sharp(output.buffer).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(24);
    expect(metadata.height).toBe(16);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
  });

  test("rejects MIME spoofing and invalid image bytes", async () => {
    const jpeg = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "white" },
    }).jpeg().toBuffer();

    await expect(secureImageUploadForTest(jpeg, "image/png", 1024)).rejects.toMatchObject({
      code: "image_mime_mismatch",
    });
    await expect(secureImageUploadForTest(Buffer.from("not-an-image"), "image/jpeg", 1024)).rejects.toMatchObject({
      code: "invalid_image",
    });
  });
});
