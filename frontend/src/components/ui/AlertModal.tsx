"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Market, Product } from "@/lib/api";
import AlertModalForm from "./alert/AlertModalForm";
import { INITIAL_FORM, type AlertFormState } from "./alert/types";

export { openAlertModal } from "./alert/types";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  markets: Market[];
  initialProduct?: string;
  initialMarket?: string;
}

export default function AlertModal({
  isOpen,
  onClose,
  products,
  markets,
  initialProduct,
  initialMarket,
}: AlertModalProps) {
  const [form, setForm] = useState<AlertFormState>(INITIAL_FORM);
  const [status, setStatus] = useState<SubmitState>({ kind: "idle" });

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
      setStatus({ kind: "idle" });
      return;
    }
    setForm((prev) => ({
      ...INITIAL_FORM,
      productSlug: initialProduct ?? prev.productSlug,
      marketSlug: initialMarket ?? prev.marketSlug,
    }));
  }, [isOpen, initialProduct, initialMarket]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleChange = useCallback(
    <K extends keyof AlertFormState>(key: K, value: AlertFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.kind === "loading") return;

    const product = products.find((p) => p.slug === form.productSlug);
    const market = markets.find((m) => m.slug === form.marketSlug);
    if (!product) {
      setStatus({ kind: "error", message: "Lütfen bir ürün seçin." });
      return;
    }
    const threshold = parseFloat(form.thresholdPrice);
    if (!Number.isFinite(threshold) || threshold <= 0) {
      setStatus({ kind: "error", message: "Geçerli bir hedef fiyat girin." });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const payload: Record<string, unknown> = {
        productId: product.id,
        thresholdPrice: threshold,
        direction: form.direction,
      };
      if (market) payload.marketId = market.id;
      if (form.channel === "email" && form.contactEmail) {
        payload.contactEmail = form.contactEmail;
      }
      if (form.channel === "telegram" && form.contactTelegram) {
        payload.contactTelegram = form.contactTelegram;
      }

      const res = await fetch(`${API_BASE}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`${res.status}`);
      }
      setStatus({ kind: "success" });
      setTimeout(() => onClose(), 2000);
    } catch {
      setStatus({
        kind: "error",
        message: "Alarm kurulamadı. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="alert-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[8vh] backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Fiyat Alarmı"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
              <h2 className="font-(family-name:--font-display) text-[18px] font-bold text-(--color-foreground)">
                🔔 Fiyat Alarmı Kur
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-7 w-7 items-center justify-center rounded-md text-(--color-muted) hover:bg-(--color-bg-alt) hover:text-(--color-foreground)"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5">
              <AlertModalForm
                form={form}
                onChange={handleChange}
                products={products}
                markets={markets}
              />

              {status.kind === "error" ? (
                <div className="mt-4 rounded-lg border border-(--color-danger)/40 bg-(--color-danger)/10 px-3 py-2 text-[12px] font-medium text-(--color-danger)">
                  {status.message}
                </div>
              ) : null}

              {status.kind === "success" ? (
                <div className="mt-4 rounded-lg border border-(--color-success)/40 bg-(--color-success)/10 px-3 py-2 text-[12px] font-medium text-(--color-success)">
                  ✅ Alarm kuruldu! Hedef fiyata ulaşıldığında sizi bilgilendireceğiz.
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status.kind === "loading" || status.kind === "success"}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-(--color-brand) font-(family-name:--font-display) text-[14px] font-semibold text-(--color-navy) transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status.kind === "loading" ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-navy) border-t-transparent" />
                ) : status.kind === "success" ? (
                  "Kuruldu"
                ) : (
                  "Alarmı Kur"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
