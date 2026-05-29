"use client";

import Link from "next/link";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

type Props = {
  firmId: number;
  claimStatus?: "unclaimed" | "pending" | "verified";
};

export function FirmClaimButton({ firmId, claimStatus }: Props) {
  const { user, loading } = useAuthSession();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(claimStatus === "pending");
  const [error, setError] = useState<string | null>(null);

  if (claimStatus === "verified") {
    return <span className="rounded-[6px] border border-emerald-200 bg-emerald-50 px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-emerald-700">Doğrulanmış firma</span>;
  }

  if (!loading && !user) {
    return (
      <Link href="/giris" className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)">
        Bu firma benim
      </Link>
    );
  }

  async function claim() {
    setSending(true);
    setError(null);
    try {
      await apiPost<{ id: number }>(`/firms/${firmId}/claim`, { evidence: "Public profile claim request" });
      setSent(true);
    } catch {
      setError("Talep gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={claim}
        disabled={loading || sending || sent}
        className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground) disabled:opacity-60"
      >
        {sent ? "Sahiplenme talebi alındı" : sending ? "Gönderiliyor..." : "Bu firma benim"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
