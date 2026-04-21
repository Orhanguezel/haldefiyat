"use client";

import { useState } from "react";
import { useUserAlerts, type UserAlert } from "@/lib/hooks/useUserAlerts";
import { useToast } from "@/components/providers/ToastProvider";

interface Props {
  alert: UserAlert;
  onClose: () => void;
}

export function AlertEditModal({ alert, onClose }: Props) {
  const { update } = useUserAlerts();
  const toast = useToast();
  const [price, setPrice] = useState(parseFloat(alert.thresholdPrice).toString());
  const [direction, setDirection] = useState<"above" | "below">(alert.direction);
  const [saving, setSaving] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  async function handleSave() {
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p <= 0) {
      setPriceError("Geçerli bir fiyat girin.");
      return;
    }
    setSaving(true);
    setPriceError(null);
    try {
      await update(alert.id, { thresholdPrice: p, direction });
      toast.success("Uyarı güncellendi.");
      onClose();
    } catch {
      toast.error("Güncellenemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-background)/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-xl">
        <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
          Uyarı Düzenle
        </h2>
        <p className="mt-1 text-[12px] text-(--color-muted)">{alert.productName}</p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-(--color-muted)">Eşik Fiyat (₺)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-[13px] text-(--color-foreground) outline-none focus:border-(--color-brand)"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-(--color-muted)">Yön</label>
            <div className="flex gap-2">
              {(["above", "below"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-colors ${
                    direction === d
                      ? "border-(--color-brand) bg-(--color-brand)/10 text-(--color-brand)"
                      : "border-(--color-border) text-(--color-muted) hover:border-(--color-brand)/50"
                  }`}
                >
                  {d === "above" ? "↑ Üstüne çıkınca" : "↓ Altına düşünce"}
                </button>
              ))}
            </div>
          </div>

          {priceError && (
            <p className="text-[12px] text-(--color-danger)">{priceError}</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-(--color-border) py-2 text-[13px] font-medium text-(--color-muted) hover:bg-(--color-border)/50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-(--color-brand) py-2 text-[13px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
