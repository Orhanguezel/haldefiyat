"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

export function ListingInquiryForm({ listingId }: { listingId: number }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setStatus("");
    const body = Object.fromEntries(formData.entries());
    const res = await fetch(`${API_BASE}/listings/${listingId}/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    setStatus(res.ok ? "Teklifiniz alındı." : "Teklif gönderilemedi.");
  }

  return (
    <form action={submit} className="space-y-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4">
      <Input name="name" label="Ad soyad" required minLength={2} />
      <Input name="phone" label="Telefon" required minLength={5} />
      <Input name="offerPrice" label="Teklif fiyatı" type="number" step="0.01" />
      <TextArea name="message" label="Mesaj" required minLength={5} />
      <Button loading={loading} className="w-full">Teklif gönder</Button>
      {status ? <p className="text-sm text-(--color-muted)">{status}</p> : null}
    </form>
  );
}

