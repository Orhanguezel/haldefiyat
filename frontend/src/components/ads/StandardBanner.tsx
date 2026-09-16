"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, X } from "lucide-react";
import { adFormat } from "../../../../shared/banner-layout.mjs";
import type { PublicBanner } from "@/lib/banners";
import { resolveImageUrl } from "@/lib/utils";
import ResilientAdImage from "./ResilientAdImage";
import styles from "./StandardBanner.module.css";
import dialogStyles from "./GzlTechnologyBanner.module.css";
const QuoteForm = dynamic(() => import("./GzlQuoteForm"), { loading: () => <p role="status">Form yükleniyor…</p> });
export default function StandardBanner({ banner, href }: { banner: PublicBanner; href: string | null }) {
  const config = banner.creativeConfig ?? {};
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId();
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (!opened) return; const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, [opened]);
  const listing = banner.sourceType === "listing" ? banner.listing : null;
  const media = listing?.imageUrl || banner.imageUrl;
  const title = listing?.title || banner.caption || banner.title;
  const description = listing ? (listing.priceMin == null ? "Fiyat için iletişime geçin" : `${Number(listing.priceMin).toLocaleString("tr-TR")} ${listing.currency}/${listing.priceUnit}`) : config.description;
  const deviceClass = banner.device === "desktop" ? "hidden md:block" : banner.device === "mobile" ? "md:hidden" : "";
  return <div className={`${styles.frame} ${deviceClass}`} data-ad-format={adFormat(banner)} data-format={adFormat(banner)}>
    <a className={styles.card} href={href || undefined} target={href ? banner.linkTarget || "_blank" : undefined} rel={href ? banner.rel || "sponsored nofollow noopener" : undefined}
      style={{ "--ad-bg": config.backgroundColor || "#123d2a", "--ad-fg": config.textColor || "#ffffff", "--ad-accent": config.accentColor || "#e8c766" } as CSSProperties}
      onClick={event => { if (config.action !== "quote" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); setOpened(true); dialog.current?.showModal(); if (href) void fetch(href, { redirect: "manual", cache: "no-store" }).catch(() => {}); }}>
      <span className={styles.label}>Sponsorlu</span>
      {media || config.mediaKind === "radar" ? <span className={styles.media} data-ad-media>
        {config.mediaKind === "radar" ? <span className={`${styles.radar} block`} aria-hidden="true" /> : <ResilientAdImage src={resolveImageUrl(media!)} alt={banner.alt || title} width={640} height={480} style={{ objectFit: config.imageFit || "cover", objectPosition: `${config.focalX ?? 50}% ${config.focalY ?? 50}%` }} />}
      </span> : null}
      <span className={styles.copy}>
        {config.logoUrl ? <ResilientAdImage src={resolveImageUrl(config.logoUrl)} alt={banner.advertiser || ""} className={styles.logo} width={160} height={32} hideOnError /> : <span className={styles.brand}>{banner.advertiser || (listing ? "Sponsorlu ilan" : "Reklam")}</span>}
        <strong className={styles.title}>{title}</strong>
        {description ? <span className={styles.description}>{description}</span> : null}
        <span className={styles.cta}>{banner.ctaLabel || "İncele"}<ArrowRight size={16} className="shrink-0" aria-hidden="true" /></span>
      </span>
    </a>
    {config.action === "quote" ? <dialog ref={dialog} className={dialogStyles.dialog} aria-labelledby={titleId} onClose={() => setOpened(false)}>
      <div className={dialogStyles.dialogHeader}><h2 id={titleId}>Projenizi konuşalım</h2><button type="button" className={dialogStyles.close} aria-label="Teklif formunu kapat" onClick={() => dialog.current?.close()}><X size={24} /></button></div>
      <div className={dialogStyles.form}>{opened ? <QuoteForm /> : null}</div>
    </dialog> : null}
  </div>;
}
