import styles from "./VistaSeedsLeaderboard.module.css";

type Props = {
  href: string | null;
  target: string;
  rel: string;
  alt: string;
  headline?: string | null;
  ctaLabel?: string | null;
};

const ASSET_ROOT = "/assets/ads/vistaseeds";

export default function VistaSeedsLeaderboard({ href, target, rel, alt, headline, ctaLabel }: Props) {
  return (
    <a
      className={styles.creative}
      href={href ?? undefined}
      target={href ? target : undefined}
      rel={href ? rel : undefined}
      aria-label={alt}
    >
      <span className={styles.products} aria-hidden="true">
        <span className={styles.productFrame}>
          {/* eslint-disable @next/next/no-img-element */}
          <img className={styles.product} src={`${ASSET_ROOT}/lucky-f1.webp`} alt="" />
          <img className={styles.product} src={`${ASSET_ROOT}/cankan-f1.webp`} alt="" />
          <img className={styles.product} src={`${ASSET_ROOT}/saray-f1.webp`} alt="" />
          {/* eslint-enable @next/next/no-img-element */}
        </span>
      </span>

      <span className={styles.copy} aria-hidden="true">
        <span className={styles.eyebrow}>Profesyonel hibrit tohum</span>
        <span className={styles.headline}>{headline || "Her hasatta güçlü performans."}</span>
        <span className={styles.subline}>Pazar değeri yüksek, güvenilir VistaSeeds çeşitleri.</span>
        <span className={styles.cta}>
          {ctaLabel || "Çeşitleri keşfet"}
          <span className={styles.arrow}>→</span>
        </span>
      </span>

      <span className={styles.brandWrap} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.brand} src={`${ASSET_ROOT}/logo-white.png`} alt="" />
      </span>
    </a>
  );
}
