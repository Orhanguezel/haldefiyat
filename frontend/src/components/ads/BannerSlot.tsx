import { fetchBanner, type PublicBanner } from "@/lib/banners";
import { resolveImageUrl } from "@/lib/utils";

// Cihaz hedefleme CSS ile: all → her zaman, desktop → mobilde gizli, mobile → masaüstünde gizli.
function deviceClass(device: PublicBanner["device"]): string {
  if (device === "desktop") return "hidden md:block";
  if (device === "mobile") return "md:hidden";
  return "";
}

function BannerCreative({ banner }: { banner: PublicBanner }) {
  if (banner.type === "code" && banner.code) {
    return <div dangerouslySetInnerHTML={{ __html: banner.code }} />;
  }
  if (!banner.imageUrl) return null;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveImageUrl(banner.imageUrl)}
      alt={banner.alt ?? banner.title}
      loading="lazy"
      decoding="async"
      className="h-auto max-w-full rounded-lg"
    />
  );
  if (!banner.linkUrl) return img;
  return (
    <a
      href={`/api/v1/banners/${banner.id}/click`}
      target={banner.linkTarget || "_blank"}
      rel={banner.rel || "sponsored nofollow noopener"}
    >
      {img}
    </a>
  );
}

type Props = { position: string; className?: string };

export default async function BannerSlot({ position, className = "" }: Props) {
  const banner = await fetchBanner(position);
  if (!banner) return null;

  return (
    <div className={`${deviceClass(banner.device)} ${className}`.trim()} aria-label="Reklam">
      <div className="mx-auto my-6 w-full max-w-5xl px-4">
        <div className="mb-1 text-center font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">
          Sponsorlu
        </div>
        <div className="flex justify-center">
          <BannerCreative banner={banner} />
        </div>
      </div>
    </div>
  );
}
