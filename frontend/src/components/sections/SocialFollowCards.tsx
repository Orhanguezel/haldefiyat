"use client";

import { ArrowUpRight } from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488" /></svg>;
}

function FacebookIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-9h3l.5-4h-3.5V7c0-1.2.4-2 2-2H17V1.4c-.3 0-1.6-.2-3-.2-3 0-5 1.8-5 5.2V9H6v4h3v9z" /></svg>;
}

function TelegramIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m21.8 3.2-3.4 17c-.3 1.2-1 1.5-2 .9l-5.2-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.3 9.6-8.7c.4-.4-.1-.6-.6-.2L5.2 13.5.1 11.9c-1.1-.4-1.1-1.1.2-1.6L20.2 2.6c.9-.3 1.7.2 1.6.6z" /></svg>;
}

type Props = {
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  facebookUrl?: string | null;
  placement: "home" | "footer";
};

function trackClick(platform: string, placement: Props["placement"]) {
  try {
    if (localStorage.getItem("hf_cookie_consent") !== "accepted") return;
    window.gtag?.("event", "social_channel_click", { platform, placement });
  } catch { /* Storage may be unavailable; following the link still works. */ }
}

export default function SocialFollowCards({ whatsappUrl, facebookUrl, telegramUrl, placement }: Props) {
  if (!whatsappUrl && !facebookUrl && !telegramUrl) return null;
  const cards = [
    { platform: "whatsapp", url: whatsappUrl, label: "WHATSAPP KANALI", title: "Hal fiyatları cebinde.", description: "Hal fiyatlarını ve kaynaklı piyasa analizlerini kanalımızdan takip et.", cta: "WhatsApp kanalını takip et", Icon: WhatsAppIcon, surface: "bg-[#e6f8ec]", color: "bg-[#087c3e]", ink: "text-[#075c30]" },
    { platform: "facebook", url: facebookUrl, label: "FACEBOOK SAYFAMIZ", title: "Piyasayı birlikte takip edelim.", description: "Fiyat paylaşımlarını incele, yorumunla HaldeFiyat topluluğuna katıl.", cta: "Facebook’ta takip et", Icon: FacebookIcon, surface: "bg-[#eaf2ff]", color: "bg-[#1859c9]", ink: "text-[#164b9d]" },
    { platform: "telegram", url: telegramUrl, label: "TELEGRAM KANALI", title: "Fiyat gündemi Telegram’da.", description: "Hal fiyatları ve piyasa paylaşımlarını Telegram kanalımızdan takip et.", cta: "Telegram kanalına katıl", Icon: TelegramIcon, surface: "bg-[#e4f5fc]", color: "bg-[#087ba9]", ink: "text-[#075b80]" },
  ].filter((card) => card.url);

  return (
    <section aria-label="HaldeFiyat sosyal kanallarını takip et" data-social-follow={placement} className="py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-7 w-1 rounded-full bg-[#FE7107]" aria-hidden="true" />
        <h2 className="text-xl font-bold text-(--color-foreground) sm:text-2xl">Piyasadan haberdar ol</h2>
      </div>
      <div className={`grid gap-4 ${cards.length === 3 ? "lg:grid-cols-3" : cards.length === 2 ? "md:grid-cols-2" : ""}`}>
        {cards.map(({ platform, url, label, title, description, cta, Icon, surface, color, ink }) => (
          <a key={platform} href={url!} target="_blank" rel="noopener noreferrer"
            onClick={() => trackClick(platform, placement)}
            className={`group flex min-w-0 flex-col rounded-2xl border border-black/10 p-5 shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#FE7107] sm:p-6 ${surface}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex min-w-0 flex-col gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logohaldefiyat_light.png" alt="HaldeFiyat" width="154" height="58" className="h-auto w-[154px] max-w-full mix-blend-multiply" loading="lazy" />
                <span className={`text-[11px] font-bold tracking-wider ${ink}`}>{label}</span>
              </span>
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white ${color}`}><Icon className="h-10 w-10" aria-hidden="true" /></span>
            </div>
            <h3 className="max-w-sm text-[27px] font-extrabold leading-tight tracking-tight text-[#01142A] sm:text-[30px]">{title}</h3>
            <p className="mb-5 mt-3 max-w-md text-[15px] leading-6 text-[#334657]">{description}</p>
            <span className={`mt-auto flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-white ${color}`}>
              {cta}<ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
