"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

export default function FirmLeadForm({ firmSlug }: { firmSlug: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

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
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talep gönderilemedi");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4">
      <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">
        Bu Firma İçin Talep Bırakın
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" label="Ad Soyad" required disabled={status === "loading"} />
        <Input name="phone" label="Telefon" disabled={status === "loading"} />
      </div>
      <Input name="email" type="email" label="E-posta" disabled={status === "loading"} />
      <TextArea name="message" label="Mesaj" required rows={4} disabled={status === "loading"} />
      {status === "success" && <p className="text-sm text-success">Talebiniz alındı. Ekip en kısa sürede dönüş yapacak.</p>}
      {status === "error" && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" loading={status === "loading"}>Talep gönder</Button>
    </form>
  );
}
