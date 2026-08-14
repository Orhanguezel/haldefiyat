"use client";

import { useEffect, useRef, useState } from "react";
import { ListingCallRequest } from "./ListingCallRequest";
import { ListingInquiryForm } from "./ListingInquiryForm";

type PreferredSlot = "asap" | "morning" | "afternoon" | "evening";

function ContactForms({ listingId, enabled, availableSlots }: {
  listingId: number;
  enabled: boolean;
  availableSlots: PreferredSlot[];
}) {
  return (
    <div className="space-y-5">
      <ListingCallRequest listingId={listingId} enabled={enabled} availableSlots={availableSlots} />
      <section aria-labelledby="listing-message-title">
        <h2 id="listing-message-title" className="mb-2 text-sm font-semibold text-(--color-foreground)">Mesaj gönder</h2>
        <p className="mb-3 text-xs leading-5 text-(--color-muted)">Arama talebi yerine yazılı teklif bırakmak isterseniz bu ikincil formu kullanın.</p>
        <ListingInquiryForm listingId={listingId} />
      </section>
    </div>
  );
}

export function ListingContactPanel({ listingId, enabled, availableSlots }: {
  listingId: number;
  enabled: boolean;
  availableSlots: PreferredSlot[];
}) {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (desktop) {
    return <ContactForms listingId={listingId} enabled={enabled} availableSlots={availableSlots} />;
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-16 z-50 border-t border-(--color-border) bg-(--color-surface)/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.14)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-[minmax(0,1fr)_auto] gap-2">
          <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="min-h-11 rounded-lg bg-(--color-brand) px-5 text-sm font-semibold text-(--color-brand-fg)">
            Satıcıyı ara
          </button>
          <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="min-h-11 rounded-lg border border-(--color-border) px-4 text-sm font-semibold text-(--color-foreground)">
            Mesaj gönder
          </button>
        </div>
      </div>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} onCancel={() => setOpen(false)} aria-labelledby="listing-contact-title" className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[20px] border border-(--color-border) bg-(--color-surface) p-0 text-(--color-foreground) shadow-2xl backdrop:bg-black/45 lg:hidden">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-3">
          <h2 id="listing-contact-title" className="font-(family-name:--font-display) text-lg font-bold">Satıcıyla iletişim</h2>
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border border-(--color-border)" aria-label="İletişim panelini kapat">×</button>
        </div>
        <div className="p-4 pb-8">
          <ContactForms listingId={listingId} enabled={enabled} availableSlots={availableSlots} />
        </div>
      </dialog>
    </>
  );
}
