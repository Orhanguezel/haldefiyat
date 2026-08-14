"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { trackAdConversion } from "@/lib/ad-conversions";
import Link from "next/link";
import { FirmFormHeader } from "./FirmFormHeader";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

export default function FirmLeadForm({ firmSlug }: { firmSlug: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      preferredChannel: String(formData.get("preferredChannel") ?? "phone"),
      message: String(formData.get("message") ?? "").trim(),
      privacyConsent: formData.get("privacyConsent") === "on",
    };
    if (!data.phone && !data.email) {
      setStatus("error");
      setError("Telefon veya e-posta alanlarından en az birini doldurun.");
      return;
    }
    if (data.preferredChannel === "phone" && !data.phone) {
      setStatus("error");
      setError("Telefonla dönüş için telefon alanını doldurun.");
      return;
    }
    if (data.preferredChannel === "email" && !data.email) {
      setStatus("error");
      setError("E-posta ile dönüş için e-posta alanını doldurun.");
      return;
    }
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`${API_BASE}/firms/${encodeURIComponent(firmSlug)}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Talep gönderilemedi");
      }
      event.currentTarget.reset();
      trackAdConversion("firm_contact", "firm", firmSlug);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talep gönderilemedi");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
      <FirmFormHeader
        eyebrow="Firma iletişim formu"
        title="Bu firma için talep bırakın"
        description="Talebiniz HalDeFiyat ekibine kaydedilir ve ilgili firmaya yönlendirilmek üzere değerlendirilir; anlık görüşme veya geri dönüş garantisi vermez."
      />
      <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" label="Ad Soyad" required disabled={status === "loading"} />
        <Input name="phone" type="tel" label="Telefon" hint="Telefon veya e-posta alanlarından en az birini doldurun." disabled={status === "loading"} />
      </div>
      <Input name="email" type="email" label="E-posta" disabled={status === "loading"} />
      <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
        Tercih edilen dönüş kanalı
        <select name="preferredChannel" defaultValue="phone" className="min-h-11 rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
          <option value="phone">Telefon</option>
          <option value="email">E-posta</option>
        </select>
      </label>
      <TextArea name="message" label="Mesaj" required rows={4} disabled={status === "loading"} />
      <label className="flex items-start gap-3 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg-alt) p-3 text-xs leading-5 text-(--color-muted)">
        <input name="privacyConsent" type="checkbox" required className="mt-1 h-4 w-4 accent-(--color-brand)" />
        <span>
          İletişim bilgilerimin bu talebin işlenmesi ve firmaya yönlendirilmesi amacıyla kullanılmasını kabul ediyorum. {" "}
          <Link href="/gizlilik-politikasi" className="font-semibold text-(--color-brand) underline underline-offset-2">Gizlilik politikasını okuyun.</Link>
        </span>
      </label>
      {status === "success" && <p role="status" className="text-sm text-success">Talebiniz kaydedildi. Uygun bulunursa firma veya HalDeFiyat ekibi geri dönüş yapabilir.</p>}
      {status === "error" && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" loading={status === "loading"}>Talep gönder</Button>
      </div>
    </form>
  );
}
