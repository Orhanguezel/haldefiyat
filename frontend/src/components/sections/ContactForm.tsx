"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Mail, MapPin, MessageCircle, Phone, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ConversionEventName, trackConversion } from "@/lib/analytics";

interface ContactFormProps {
  defaultSubject?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactAddress?: string;
  conversionEventName?: Extract<ConversionEventName, "embed_inquiry" | "pro_upgrade">;
  conversionParams?: Record<string, string | number | boolean | null | undefined>;
}

export function ContactForm({
  defaultSubject = "",
  contactEmail = "info@gzlteknoloji.com",
  contactPhone,
  contactWhatsapp,
  contactAddress,
  conversionEventName,
  conversionParams,
}: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "success" || status === "error") statusRef.current?.focus();
  }, [status]);
  const contactInfo = [
    {
      icon: Mail,
      label: "E-posta",
      value: contactEmail,
      href: `mailto:${contactEmail}`,
    },
    ...(contactPhone
      ? [{
          icon: Phone,
          label: "Telefon",
          value: contactPhone,
          href: `tel:${contactPhone.replace(/[^\d+]/g, "")}`,
        }]
      : []),
    ...(contactWhatsapp
      ? [{
          icon: MessageCircle,
          label: "WhatsApp",
          value: contactWhatsapp,
          href: `https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`,
        }]
      : []),
    ...(contactAddress
      ? [{
          icon: MapPin,
          label: "Adres",
          value: contactAddress,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`,
        }]
      : []),
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      privacyAccepted: formData.get("privacyAccepted") === "on",
    };

    try {
      const res = await fetch("/api/v1/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(res.status === 429 ? "rate_limited" : res.status === 400 ? "invalid_request" : "request_failed");

      setStatus("success");
      if (conversionEventName) {
        trackConversion(conversionEventName, conversionParams);
      }
    } catch (err) {
      setStatus("error");
      const code = err instanceof Error ? err.message : "request_failed";
      setErrorMessage(code === "rate_limited"
        ? "Kısa sürede çok fazla deneme yapıldı. Lütfen birkaç dakika sonra yeniden deneyin."
        : code === "invalid_request"
          ? "Bilgileri ve kişisel veri onayını kontrol edip yeniden deneyin."
          : "Mesaj şu anda gönderilemedi. Lütfen daha sonra yeniden deneyin veya e-posta kanalını kullanın.");
    }
  }

  if (status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="flex flex-col items-center justify-center py-12 text-center outline-none animate-in fade-in zoom-in duration-500">
        <div className="rounded-full bg-success/10 p-6 text-success mb-6">
          <CheckCircle2 className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Mesajınız Alındı!</h2>
        <p className="text-muted max-w-md mx-auto mb-8">
          Bize ulaştığınız için teşekkür ederiz. Mesajınız inceleme sırasına alındı; gerektiğinde verdiğiniz iletişim bilgileri üzerinden sizinle bağlantı kuracağız.
        </p>
        <Button onClick={() => setStatus("idle")} variant="secondary">
          Yeni Mesaj Gönder
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Sol taraf: Bilgiler */}
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Bizimle İletişime Geçin</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Hal fiyatları, işbirliği talepleri veya teknik destek için aşağıdaki formu doldurabilir 
            veya iletişim kanalları üzerinden bize ulaşabilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {contactInfo.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-start gap-4 p-5 rounded-2xl border border-border/40",
                "bg-surface/30 backdrop-blur-sm transition-all hover:bg-surface/50 hover:border-brand/30 group"
              )}
            >
              <div className="rounded-xl bg-brand/10 p-3 text-brand group-hover:scale-110 transition-transform">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  {item.label}
                </p>
                <p className="text-foreground font-medium">{item.value}</p>
              </div>
            </a>
          ))}
        </div>

      </div>

      {/* Sağ taraf: Form */}
      <div>
        <form 
          onSubmit={handleSubmit}
          aria-busy={status === "loading" || undefined}
          className="space-y-6 rounded-[10px] border border-border bg-surface p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              name="name"
              label="Adınız Soyadınız"
              placeholder="Örn: Ahmet Yılmaz"
              required
              disabled={status === "loading"}
            />
            <Input
              name="email"
              type="email"
              label="E-posta Adresi"
              placeholder="ahmet@example.com"
              required
              disabled={status === "loading"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              name="phone"
              label="Telefon Numarası"
              placeholder="+90 5XX XXX XX XX"
              required
              disabled={status === "loading"}
            />
            <Input
              name="subject"
              label="Konu"
              placeholder="Mesaj konusu"
              defaultValue={defaultSubject}
              required
              disabled={status === "loading"}
            />
          </div>

          <TextArea
            name="message"
            label="Mesajınız"
            placeholder="Size nasıl yardımcı olabiliriz?"
            required
            rows={5}
            disabled={status === "loading"}
          />

          <div aria-hidden="true" className="hidden">
            <label htmlFor="contact-website">Web sitesi</label>
            <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
            <input
              type="checkbox"
              name="privacyAccepted"
              required
              disabled={status === "loading"}
              className="mt-1 h-4 w-4 shrink-0 accent-(--color-brand)"
            />
            <span>
              İletişim talebimin yanıtlanması amacıyla verdiğim bilgilerin işlenmesine ilişkin{" "}
              <Link href="/kvkk" className="font-semibold text-brand underline underline-offset-2">KVKK Aydınlatma Metni</Link>
              {" "}ve{" "}
              <Link href="/gizlilik-politikasi" className="font-semibold text-brand underline underline-offset-2">Gizlilik Politikası</Link>
              ’nı okudum ve kabul ediyorum.
            </span>
          </label>

          {status === "error" && (
            <div ref={statusRef} tabIndex={-1} role="alert" className="flex items-center gap-3 rounded-xl bg-danger/10 p-4 text-danger outline-none animate-shake">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold rounded-xl gap-2 shadow-xl shadow-brand/20"
            loading={status === "loading"}
          >
            Mesajı Gönder
            {status !== "loading" ? <Send className="h-5 w-5" /> : null}
          </Button>
        </form>
      </div>
    </div>
  );
}
