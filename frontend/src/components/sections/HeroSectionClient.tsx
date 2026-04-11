"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Feature {
  icon: string;
  label: string;
}

const FEATURES: ReadonlyArray<Feature> = [
  { icon: "📊", label: "Günlük Fiyat Verileri" },
  { icon: "🏪", label: "81 İl Hal Bilgisi" },
  { icon: "📈", label: "Fiyat Grafikleri" },
  { icon: "🔔", label: "Fiyat Uyarıları" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

export default function HeroSectionClient() {
  return (
    <div className="mx-auto max-w-[860px]">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-(--color-brand)/20 bg-(--color-brand)/10 px-[18px] py-1.5 font-(family-name:--font-mono) text-[12px] font-semibold uppercase tracking-[0.08em] text-(--color-brand)"
      >
        <span className="live-dot-sm" aria-hidden />
        Canlı Veri Akışı · 81 İl
      </motion.div>

      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
        className="font-(family-name:--font-display) text-[42px] font-black leading-[1.05] tracking-[-0.04em] text-(--color-foreground) sm:text-[52px] lg:text-[64px]"
      >
        Türkiye Hal Fiyatları
        <br />
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #84f04c, #4ade80, #c0ffaa)",
          }}
        >
          Tek Ekranda
        </span>
      </motion.h1>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        className="mx-auto mt-6 max-w-[600px] text-[19px] leading-[1.7] text-(--color-muted)"
      >
        İstanbul, Ankara, İzmir ve tüm illerden günlük sebze-meyve hal
        fiyatlarını anlık takip edin. Fiyat grafikleri, trend analizleri ve
        akıllı uyarılar.
      </motion.p>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        className="mx-auto mt-10 mb-16 flex w-full max-w-md flex-col items-stretch justify-center gap-3.5 sm:max-w-none sm:flex-row sm:items-center"
      >
        <Link
          href="/fiyatlar"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-(--color-brand) px-9 py-4 font-(family-name:--font-display) text-[16px] font-bold text-(--color-navy) shadow-[0_0_30px_rgba(132,240,76,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--color-brand-dark) hover:shadow-[0_0_40px_rgba(132,240,76,0.35)]"
        >
          📊 Fiyatları Keşfet
        </Link>
        <a
          href="#nasil-calisir"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-(--color-border) bg-white/[0.04] px-7 py-4 font-(family-name:--font-display) text-[16px] font-semibold text-(--color-muted) transition-all duration-300 hover:border-(--color-muted) hover:bg-white/[0.08] hover:text-(--color-foreground)"
        >
          Nasıl Çalışır?
        </a>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
        className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-10"
      >
        {FEATURES.map((feat) => (
          <div
            key={feat.label}
            className="flex items-center gap-2.5 text-[14px] text-(--color-muted)"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-(--color-border) bg-white/[0.04] text-base">
              {feat.icon}
            </div>
            <span>{feat.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
