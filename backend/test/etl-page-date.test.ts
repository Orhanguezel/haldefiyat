import { describe, expect, it } from "bun:test";
import { extractSourcePageDate } from "@/modules/etl/fetcher";

describe("kaynak sayfasindaki yayin tarihi", () => {
  it("Kutahya tek haneli gun/ay yazimini okur", () => {
    expect(extractSourcePageDate("kutahya_resmi", "<p>Hal Fiyatları 24.8.2026 tarihli liste</p>")).toBe("2026-08-24");
    expect(extractSourcePageDate("kutahya_resmi", "<p>05.09.2026</p>")).toBe("2026-09-05");
  });

  it("tanimli olmayan kaynakta null doner (davranis degismez)", () => {
    expect(extractSourcePageDate("bursa_resmi", "<p>24.8.2026</p>")).toBeNull();
  });

  it("gelecek ve cok eski tarihler yok sayilir", () => {
    const gelecek = new Date(Date.now() + 5 * 86_400_000);
    const g = `${gelecek.getDate()}.${gelecek.getMonth() + 1}.${gelecek.getFullYear()}`;
    expect(extractSourcePageDate("kutahya_resmi", `<p>${g}</p>`)).toBeNull();
    expect(extractSourcePageDate("kutahya_resmi", "<p>1.1.2024</p>")).toBeNull();
  });

  it("script icindeki tarihler sayilmaz", () => {
    expect(extractSourcePageDate("kutahya_resmi", "<script>var d='1.1.2026'</script><p>3.9.2026</p>")).toBe("2026-09-03");
  });
});
