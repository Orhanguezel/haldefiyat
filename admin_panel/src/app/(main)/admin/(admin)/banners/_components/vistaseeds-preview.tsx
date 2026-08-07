import styles from './vistaseeds-preview.module.css';

type Props = {
  variant: 'sidebar' | 'leaderboard';
  headline: string;
  ctaLabel: string;
};

const ROOT = '/assets/ads/vistaseeds';

export function VistaSeedsPreview({ variant, headline, ctaLabel }: Props) {
  return (
    <div className={`${styles.preview} ${styles[variant]}`}>
      <div className={styles.stage}>
        {/* eslint-disable @next/next/no-img-element */}
        <img className={styles.product} src={`${ROOT}/lucky-f1.webp`} alt="" />
        <img className={styles.product} src={`${ROOT}/cankan-f1.webp`} alt="" />
        <img className={styles.product} src={`${ROOT}/saray-f1.webp`} alt="" />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Profesyonel hibrit tohum</span>
        <span className={styles.headline}>{headline || (variant === 'sidebar' ? 'Verimin rengi değişir.' : 'Her hasatta güçlü performans.')}</span>
        <span className={styles.cta}>{ctaLabel || 'Çeşitleri keşfet'} →</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.brand} src={`${ROOT}/logo-white.png`} alt="VistaSeeds" />
    </div>
  );
}
