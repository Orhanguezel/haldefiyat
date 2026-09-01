import { setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/sections/ContactForm";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Breadcrumb from "@/components/seo/Breadcrumb";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo";
import { fetchSiteSettings } from "@/lib/site-settings";
import PageContainer from "@/components/layout/PageContainer";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ subject?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("iletisim", {
    locale,
    pathname: "/iletisim",
    title: "İletişim | HaldeFiyat",
    description: "HaldeFiyat ekibiyle iletişime geçin; soru, öneri ve destek taleplerinizi gönderin.",
  });
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const subject = (await searchParams)?.subject ?? "";
  const isProInquiry = subject.toLocaleLowerCase("tr-TR").includes("pro");
  setRequestLocale(locale);
  const settings = await fetchSiteSettings(locale);

  return (
    <div className="min-h-screen bg-(--color-bg) pb-20 pt-24">
      <PageContainer py="none">
        <ScrollReveal>
          <div className="max-w-350 mx-auto">
            <Breadcrumb visible items={[
              { name: "Anasayfa", href: "/" },
              { name: "İletişim", href: "/iletisim" },
            ]} />
            {/* Header Bölümü */}
            <header className="mb-16 text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-6 tracking-tight">
                Size Nasıl <span className="text-brand">Yardımcı</span> Olabiliriz?
              </h1>
              <p className="text-lg sm:text-xl text-muted leading-relaxed">
                Soru, görüş ve önerilerinizi güvenli iletişim formuyla iletebilirsiniz.
                Mesajlar sırayla incelenir; gerekli olduğunda sizinle bağlantı kurulur.
              </p>
            </header>

            {/* İletişim Formu ve Bilgiler */}
            <ContactForm
              defaultSubject={subject}
              contactEmail={settings.contact_email || "info@gzlteknoloji.com"}
              contactPhone={settings.contact_phone}
              contactWhatsapp="+49 172 3846068"
              contactAddress={settings.contact_address}
              conversionEventName={isProInquiry ? "pro_upgrade" : undefined}
              conversionParams={isProInquiry ? { source_page: "pro", value: 99 } : undefined}
            />
            <section className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border/50 bg-surface/40 p-6 text-sm leading-relaxed text-muted">
              <h2 className="text-lg font-bold text-foreground">Yayıncı ve sorumluluk bilgisi</h2>
              <p className="mt-3">
                Platform işletmecisi <strong className="text-foreground">{settings.legal_entity_name}</strong>,
                sorumlu yayıncı <strong className="text-foreground">{settings.responsible_publisher_name}</strong> ve
                teknik yürütme sorumlusu <strong className="text-foreground">{settings.technical_contact_name}</strong>’dir.
                Veri, içerik, düzeltme, basın ve ticari işbirliği bildirimleri yukarıdaki kurumsal
                iletişim kanalından alınır.
              </p>
              {!settings.contact_address ? (
                <p className="mt-3 text-xs">Açık adres bilgisi doğrulama tamamlanmadan yayımlanmamaktadır.</p>
              ) : null}
              <p className="mt-3">
                İçerik ve veri süreçleri için{" "}
                <Link className="font-semibold text-brand underline underline-offset-2" href="/editoryal-politika">
                  Editoryal Politika
                </Link>
                ,{" "}
                <Link className="font-semibold text-brand underline underline-offset-2" href="/duzeltme-politikasi">
                  Düzeltme Politikası
                </Link>{" "}
                ve{" "}
                <Link className="font-semibold text-brand underline underline-offset-2" href="/veri-kaynagi-politikasi">
                  Veri Kaynağı Politikası
                </Link>{" "}
                geçerlidir.
              </p>
            </section>
          </div>
        </ScrollReveal>
      </PageContainer>
    </div>
  );
}
