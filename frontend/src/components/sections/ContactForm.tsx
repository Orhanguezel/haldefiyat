"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Mail, MapPin, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "E-posta",
    value: "iletisim@haldefiyat.com",
    href: "mailto:iletisim@haldefiyat.com",
  },
  {
    icon: MapPin,
    label: "Adres",
    value: "Antalya Toptancı Hali, Kepez, Antalya",
    href: "https://maps.google.com",
  },
];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/v1/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Bir hata oluştu");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Mesaj gönderilemedi");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="rounded-full bg-success/10 p-6 text-success mb-6">
          <CheckCircle2 className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Mesajınız Alındı!</h2>
        <p className="text-muted max-w-md mx-auto mb-8">
          Bize ulaştığınız için teşekkür ederiz. Ekibimiz en kısa sürede size geri dönüş yapacaktır.
        </p>
        <Button onClick={() => setStatus("idle")} variant="outline">
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
          {CONTACT_INFO.map((item) => (
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

        <div className="p-8 rounded-2xl bg-gradient-to-br from-brand/20 to-success/20 border border-brand/10">
          <h3 className="font-bold text-foreground mb-2">Çalışma Saatleri</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Pazartesi - Cuma: 09:00 - 18:00<br />
            Cumartesi: 09:00 - 13:00<br />
            Pazar: Kapalı
          </p>
        </div>
      </div>

      {/* Sağ taraf: Form */}
      <div className="relative group">
        {/* Dekoratif Işıklar */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand/40 to-success/40 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
        
        <form 
          onSubmit={handleSubmit}
          className="relative bg-surface/80 backdrop-blur-md border border-border p-8 sm:p-10 rounded-3xl space-y-6"
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

          {/* Honeypot */}
          <div className="hidden">
            <input type="text" name="website" />
          </div>

          {status === "error" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 text-danger animate-shake">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold rounded-xl gap-2 shadow-xl shadow-brand/20"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Gönderiliyor..." : "Mesajı Gönder"}
            <Send className={cn("h-5 w-5", status === "loading" && "animate-pulse")} />
          </Button>
        </form>
      </div>
    </div>
  );
}
