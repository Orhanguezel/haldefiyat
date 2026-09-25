import { describe, expect, test } from "bun:test";
import { resolveSelfServiceOwner, selfServiceCampaignView, type BannerRow } from "@/modules/banners/repository";
import { selfServiceReportRange } from "@/modules/banners";

const listing = { id: 36, slug: "murdum-erigi", title: "Mürdüm eriği", status: "approved" };
const banner = {
  id: 17, firmId: null, listingId: 36, title: "Mürdüm eriği · sponsorlu ilan", position: "global_footer",
  lifecycleStatus: "live", imageUrl: null, caption: null, ctaLabel: null, linkUrl: null, device: "all",
  startAt: null, endAt: null, impressions: 12409, clicks: 12, performanceStatus: "normal",
  paymentStatus: "waived", totalAmount: "0.00", invoiceNumber: null, invoiceUrl: null, contractFileUrl: null,
} as unknown as BannerRow;

describe("reklam portalı sahiplik çözümü", () => {
  test("ilan sahibi firma kaydı olmadan kendi ilan reklamını görür ve bedeli okur", () => {
    const owner = resolveSelfServiceOwner(banner, "user-1", new Map(), new Map([[36, listing]]));
    expect(owner).toEqual({ ownerType: "listing", canViewFinancials: true, listing });
  });

  test("firma üyesi finansal yetkisi yoksa bedel alanları gizlenir", () => {
    const firmBanner = { ...banner, listingId: null, firmId: 5 } as BannerRow;
    const owner = resolveSelfServiceOwner(firmBanner, "user-1", new Map([[5, false]]), new Map());
    expect(owner?.ownerType).toBe("firm");
    const view = selfServiceCampaignView(firmBanner, owner!, { uniqueImpressions: 10, uniqueClicks: 2, conversions: 1 });
    expect(view).not.toHaveProperty("totalAmount");
    expect(view.conversions).toBe(1);
  });

  test("başkasının ilanı ya da firması erişim vermez", () => {
    expect(resolveSelfServiceOwner(banner, "user-1", new Map([[5, true]]), new Map([[99, { ...listing, id: 99 }]]))).toBeNull();
  });

  test("ilan reklamı görünümü ilan bağlantısını ve bedeli taşır", () => {
    const view = selfServiceCampaignView(banner, resolveSelfServiceOwner(banner, "user-1", new Map(), new Map([[36, listing]]))!);
    expect(view.listing?.slug).toBe("murdum-erigi");
    expect(view.ownerType).toBe("listing");
    expect(view.paymentStatus).toBe("waived");
    expect(view.uniqueImpressions).toBe(0);
  });

  test("shows a custom campaign to its directly assigned account", () => {
    const accountBanner = { ...banner, listingId: null, ownerUserId: "user-1" };
    const owner = resolveSelfServiceOwner(accountBanner, "user-1", new Map(), new Map());
    expect(owner).toEqual({ ownerType: "account", canViewFinancials: true, listing: null });
    expect(resolveSelfServiceOwner(accountBanner, "user-2", new Map(), new Map())).toBeNull();
  });
});

describe("portal rapor tarih aralığı", () => {
  test("boş sorgu kampanya varsayılanına düşer", () => {
    expect(selfServiceReportRange({})).toEqual({ from: undefined, to: undefined });
  });
  test("biçim dışı veya ters aralık reddedilir", () => {
    expect(selfServiceReportRange({ from: "15.09.2026" })).toBeNull();
    expect(selfServiceReportRange({ from: "2026-09-15", to: "2026-09-01" })).toBeNull();
  });
  test("geçerli aralık aynen geçer", () => {
    expect(selfServiceReportRange({ from: "2026-09-01", to: "2026-09-15" })).toEqual({ from: "2026-09-01", to: "2026-09-15" });
  });
});
