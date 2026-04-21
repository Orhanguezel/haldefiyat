import { setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/sections/ContactForm";
import AmbientBackground from "@/components/ui/AmbientBackground";
import ScrollReveal from "@/components/ui/ScrollReveal";

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="relative min-h-screen overflow-hidden pt-24 pb-20">
      <AmbientBackground />
      
      <div className="container relative z-10 mx-auto px-4">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto">
            {/* Header Bölümü */}
            <header className="mb-16 text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-6 tracking-tight">
                Size Nasıl <span className="text-brand">Yardımcı</span> Olabiliriz?
              </h1>
              <p className="text-lg sm:text-xl text-muted leading-relaxed">
                Her türlü soru, görüş ve önerileriniz için yanınızdayız. 
                Mesajınızı iletin, en kısa sürede size dönüş yapalım.
              </p>
            </header>

            {/* İletişim Formu ve Bilgiler */}
            <ContactForm />
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
