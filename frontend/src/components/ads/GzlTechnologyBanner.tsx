"use client";
import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, X } from "lucide-react";
import styles from "./GzlTechnologyBanner.module.css";
const GzlQuoteForm = dynamic(() => import("./GzlQuoteForm"), { loading: () => <p role="status">Form yükleniyor…</p> });

export default function GzlTechnologyBanner({ clickHref, className = "", compactMobile = false }: { clickHref?: string | null; className?: string; compactMobile?: boolean }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [opened]);
  return <div className={`${styles.shell} ${compactMobile ? styles.compactMobile : ""} ${className}`}>
    <div className={styles.banner}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/sponsors/gzl-devices.webp" alt="" width={1000} height={667} loading="lazy" className={styles.visual} />
      <span className={styles.label}>Sponsorlu</span>
      <div className={styles.copy}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/sponsors/gzl-logo.png" alt="GZL Teknoloji" width={1443} height={264} loading="lazy" className={styles.logo} />
        <p className={styles.title}>İşinizi dijitale taşıyın</p>
        <p className={styles.services}>Web sitesi · Özel yazılım · Otomasyon</p>
        <a className={styles.cta} href={clickHref || "/gzl-teknoloji#teklif"} onClick={(event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          setOpened(true);
          dialog.current?.showModal();
          // Same click endpoint as every other banner; no navigation is needed for the dialog.
          if (clickHref) void fetch(clickHref, { redirect: "manual", cache: "no-store" }).catch(() => {});
        }}>Teklif al <ArrowRight size={18} aria-hidden="true" /></a>
      </div>
    </div>
    <dialog ref={dialog} aria-labelledby={titleId} className={styles.dialog} onClose={() => setOpened(false)}>
      <div className={styles.dialogHeader}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/sponsors/gzl-logo.png" alt="GZL Teknoloji" width={190} height={35} />
        <button type="button" aria-label="Teklif formunu kapat" className={styles.close} onClick={() => dialog.current?.close()}><X size={24} /></button>
      </div>
      <div className={styles.form}>
        <h2 id={titleId} className="text-2xl font-bold">Projenizi konuşalım</h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-(--color-muted)">İhtiyacınızı paylaşın; kapsamı ve sonraki adımları birlikte netleştirelim.</p>
        {opened && <GzlQuoteForm />}
      </div>
    </dialog>
  </div>;
}
