import { describe, expect, test } from "vitest";
import { fmtCampaignPeriod, POSITION_DETAILS } from "./ad-labels";

describe("reklam slotu sunumu", () => {
  test("tarihsiz kampanyayı anlaşılır biçimde süresiz gösterir", () => {
    expect(fmtCampaignPeriod(null, null)).toBe("Süresiz yayın");
  });

  test("slot ana sayfa ve konum bilgisini ayrı taşır", () => {
    expect(POSITION_DETAILS.firm_detail_sidebar).toEqual({
      page: "Firma detay sayfaları",
      placement: "Sağ kenar alanı",
    });
    expect(POSITION_DETAILS.analiz_inline.placement).toBe("Yazı içi reklam alanı");
  });
});
