export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { getPageMetadata, ORG_REF } from "@/lib/seo";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import PageContainer from "@/components/layout/PageContainer";
import { ContactForm } from "@/components/sections/ContactForm";

type Props = { params: Promise<{ locale: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

const PRICE_DARK = `<iframe
  src="${SITE_URL}/fiyatlar/widget?limit=6"
  width="420"
  height="430"
  style="border:none;border-radius:16px;max-width:100%;"
  title="HaldeFiyat Güncel Hal Fiyatları"
></iframe>`;

const PRICE_LIGHT = `<iframe
  src="${SITE_URL}/fiyatlar/widget?theme=light&category=sebze&limit=6"
  width="420"
  height="430"
  style="border:none;border-radius:16px;max-width:100%;"
  title="HaldeFiyat Sebze Fiyatları"
></iframe>`;

const PRICE_CUSTOM = `<iframe
  src="${SITE_URL}/fiyatlar/widget?slugs=domates,biber,salatalik&limit=3&theme=light&title=Günün%20Sebze%20Fiyatları"
  width="420"
  height="260"
  style="border:none;border-radius:16px;max-width:100%;"
  title="HaldeFiyat Özel Fiyat Widget"
></iframe>`;

const INDEX_WIDGET = `<iframe
  src="${SITE_URL}/endeks/widget"
  width="320"
  height="168"
  style="border:none;border-radius:14px;"
  title="HaldeFiyat Endeksi"
></iframe>`;

const widgetDataFeedSchema = {
  name: "HaldeFiyat Embed Widget Veri Akışı",
  description:
    "Güncel hal fiyatları ve HaldeFiyat Endeksi için iframe ile kullanılabilen, 5 dakika önbelleklenen açık veri widget'ları.",
  url: `${SITE_URL}/embed`,
  creator: ORG_REF,
  license: "https://creativecommons.org/licenses/by/4.0/",
  distribution: [
    {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: `${SITE_URL}/fiyatlar/widget?limit=6`,
      name: "Güncel Hal Fiyatları Widget",
    },
    {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: `${SITE_URL}/endeks/widget`,
      name: "HaldeFiyat Endeksi Widget",
    },
  ],
} satisfies Record<string, unknown>;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("embed", {
    locale,
    pathname: "/embed",
    title: "HaldeFiyat Embed Widget",
    description:
      "Güncel hal fiyatları ve HaldeFiyat Endeksi widget'larını iframe ile kendi sitenize ekleyin.",
  });
}

export default async function EmbedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageContainer>
      <JsonLd type="DataFeed" data={widgetDataFeedSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Embed Widget", href: "/embed" },
      ]} />

      <header className="mb-8 border-b border-(--color-border-soft) pb-8">
        <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Site Sahipleri İçin
        </div>
        <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-bold tracking-[-0.02em] text-(--color-foreground) sm:text-4xl">
          HaldeFiyat Widget'larını Sitenize Ekleyin
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] leading-6 text-(--color-muted)">
          Güncel hal fiyatları veya HaldeFiyat Endeksi'ni kendi sitenizde iframe olarak yayınlayın.
          Widget'lar 5 dakika önbelleklenir, mobil uyumludur ve HaldeFiyat'a kaynak bağlantısı içerir.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <EmbedBlock label="Güncel fiyat widget - koyu tema" code={PRICE_DARK} />
          <EmbedBlock label="Sebze fiyatları - açık tema" code={PRICE_LIGHT} />
          <EmbedBlock label="Özel ürün listesi" code={PRICE_CUSTOM} />
          <EmbedBlock label="Endeks widget" code={INDEX_WIDGET} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-(family-name:--font-display) text-base font-bold text-(--color-foreground)">
              Önizleme
            </h2>
            <p className="mt-1 text-[13px] text-(--color-muted)">
              Varsayılan fiyat widget'ı.
            </p>
            <div className="mt-4 overflow-hidden rounded-[16px]">
              <iframe
                src="/fiyatlar/widget?limit=6"
                width="420"
                height="430"
                style={{ border: "none", borderRadius: "16px", maxWidth: "100%" }}
                title="HaldeFiyat Güncel Hal Fiyatları"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-(family-name:--font-display) text-base font-bold text-(--color-foreground)">
              Parametreler
            </h2>
            <div className="mt-4 space-y-3 text-[13px] text-(--color-muted)">
              <Param name="theme" value="dark | light" />
              <Param name="category" value="sebze, meyve, balik, ithal" />
              <Param name="limit" value="3-12 arası ürün sayısı" />
              <Param name="slugs" value="domates,biber,salatalik" />
              <Param name="title" value="Widget başlığı" />
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-12 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 sm:p-8">
        <div className="mb-8 max-w-2xl">
          <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Yayıncı Talebi
          </div>
          <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-bold tracking-[-0.02em] text-(--color-foreground)">
            Widget veya veri entegrasyonu için yazın
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-(--color-muted)">
            Embed kullanımı, özel ürün listesi veya yüksek trafikli yayınlar için teknik destek talebinizi iletin.
          </p>
        </div>
        <ContactForm
          defaultSubject="Embed Widget Talebi"
          conversionEventName="embed_inquiry"
          conversionParams={{ source_page: "embed" }}
        />
      </section>
    </PageContainer>
  );
}

function EmbedBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
      <h2 className="font-(family-name:--font-display) text-base font-bold text-(--color-foreground)">
        {label}
      </h2>
      <pre className="mt-3 overflow-x-auto whitespace-pre rounded-xl border border-(--color-border) bg-(--color-bg) p-4 font-(family-name:--font-mono) text-[12px] leading-relaxed text-(--color-foreground)">
        {code}
      </pre>
    </div>
  );
}

function Param({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--color-border-soft) pb-2 last:border-b-0 last:pb-0">
      <code className="font-(family-name:--font-mono) text-[12px] text-(--color-brand)">
        {name}
      </code>
      <span className="text-right">{value}</span>
    </div>
  );
}
