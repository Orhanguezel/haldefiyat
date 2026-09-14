import { ArrowRight } from "lucide-react";
import type { PublicBanner } from "@/lib/banners";
import styles from "./IhracatRadariBanner.module.css";

export const IHRACAT_RADARI = "İhracat Radarı";

export function isIhracatRadari(banner: PublicBanner) {
  return (banner.advertiser ?? "").trim().toLocaleLowerCase("tr") === IHRACAT_RADARI.toLocaleLowerCase("tr");
}

/** Blips sit off the sweep centre so the rotation reads as a scan, not a spinner. */
const BLIPS = [
  { left: "27%", top: "31%", delay: "0s" },
  { left: "68%", top: "24%", delay: "1.1s" },
  { left: "76%", top: "62%", delay: "2.2s" },
  { left: "34%", top: "70%", delay: "3.3s" },
];

export default function IhracatRadariBanner({ banner, href, sidebar }: {
  banner: PublicBanner;
  href: string | null;
  sidebar: boolean;
}) {
  const device = banner.device === "desktop" ? "hidden md:block" : banner.device === "mobile" ? "md:hidden" : "";
  return (
    <div className={`${styles.shell} ${sidebar ? styles.vertical : ""} ${device}`.trim()}>
      <a
        className={styles.banner}
        href={href ?? undefined}
        target={href ? banner.linkTarget || "_blank" : undefined}
        rel={href ? banner.rel || "sponsored nofollow noopener" : undefined}
      >
        <span className={styles.label}>Sponsorlu</span>
        <div className={styles.copy}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/sponsors/ihracat-radari-logo-white.svg"
            alt={IHRACAT_RADARI}
            width={730}
            height={176}
            loading="lazy"
            className={styles.logo}
          />
          <p className={styles.eyebrow}>Veriye dayalı ihracat platformu</p>
          <p className={styles.title}>{banner.caption || "Ürününüzün yurt dışı alıcısını bulun"}</p>
          <p className={styles.lead}>
            GTİP/HS Code ile ithalatçı firmaları listeleyin, yetkili kişiye ulaşın.
          </p>
          <ul className={styles.facts}>
            <li>190+ ülke alıcı verisi</li>
            <li>18,8 milyon+ dış ticaret kaydı</li>
            <li>Karar verici iletişimi</li>
          </ul>
          <span className={styles.cta}>
            {banner.ctaLabel || "Alıcıları keşfet"} <ArrowRight size={17} aria-hidden="true" />
          </span>
        </div>
        <div className={styles.radar} aria-hidden="true">
          <div className={styles.scope}>
            <svg viewBox="0 0 200 200" className={styles.rings}>
              <g fill="none" stroke="#18c8d8" strokeOpacity=".34">
                <circle cx="100" cy="100" r="92" />
                <circle cx="100" cy="100" r="62" />
                <circle cx="100" cy="100" r="32" />
                <path d="M100 8v184M8 100h184" strokeOpacity=".18" />
              </g>
            </svg>
            <span className={styles.sweep} />
            {BLIPS.map((blip) => (
              <span key={blip.delay} className={styles.blip} style={{ left: blip.left, top: blip.top, animationDelay: blip.delay }} />
            ))}
          </div>
        </div>
      </a>
    </div>
  );
}
