"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";

type Summary = { maskedPhone: string | null; phonePresent: boolean; accountVerified: boolean };

export function CallRequestContactSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiGet<Summary>("/listings/call-requests/contact-summary").then(setSummary).catch(() => setFailed(true));
  }, []);

  return (
    <section className="rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-5" aria-labelledby="call-preferences-heading">
      <h2 id="call-preferences-heading" className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">İletişim tercihi ve kimlik durumu</h2>
      {failed ? <p role="alert" className="mt-3 text-sm text-(--color-danger)">İletişim özeti alınamadı.</p> : !summary ? <p role="status" className="mt-3 text-sm text-(--color-muted)">İletişim özeti yükleniyor…</p> : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4"><span className="block text-xs text-(--color-muted)">Kayıtlı telefon</span><strong className="mt-1 block text-sm text-(--color-foreground)">{summary.maskedPhone ?? "Eklenmemiş"}</strong></div>
          <div className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4"><span className="block text-xs text-(--color-muted)">Hesap doğrulaması</span><strong className="mt-1 block text-sm text-(--color-foreground)">{summary.accountVerified ? "E-posta doğrulandı" : "Doğrulama bekliyor"}</strong></div>
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-(--color-muted)">Telefonun tam hali bu özette ve public ilan cevabında dönmez. İlan bazında talep açma/kapatma ve uygun saatleri <Link href="/hesabim/ilanlarim" className="font-semibold text-(--color-brand) underline">İlanlarım</Link> sayfasından yönetin; hesap telefonu için <Link href="/hesabim/profil" className="font-semibold text-(--color-brand) underline">Profilim</Link> sayfasını kullanın.</p>
    </section>
  );
}
