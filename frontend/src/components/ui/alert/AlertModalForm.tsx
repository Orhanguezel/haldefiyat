"use client";

import type { Market, Product } from "@/lib/api";
import type { AlertChannel, AlertDirection, AlertFormState } from "./types";

interface AlertModalFormProps {
  form: AlertFormState;
  onChange: <K extends keyof AlertFormState>(key: K, value: AlertFormState[K]) => void;
  products: Product[];
  markets: Market[];
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-(--color-border) bg-(--color-bg-alt) px-3 text-[13px] text-(--color-foreground) placeholder:text-(--color-muted) focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/30";

const LABEL_CLASS =
  "mb-1.5 block font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)";

export default function AlertModalForm({
  form,
  onChange,
  products,
  markets,
}: AlertModalFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={LABEL_CLASS} htmlFor="alert-product">
          Ürün
        </label>
        <select
          id="alert-product"
          value={form.productSlug}
          onChange={(e) => onChange("productSlug", e.target.value)}
          required
          className={INPUT_CLASS}
        >
          <option value="">Ürün seçin</option>
          {products.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.nameTr}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="alert-market">
          Hal (opsiyonel)
        </label>
        <select
          id="alert-market"
          value={form.marketSlug}
          onChange={(e) => onChange("marketSlug", e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Tüm Haller</option>
          {markets.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name} ({m.cityName})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="alert-threshold">
          Hedef Fiyat (₺)
        </label>
        <input
          id="alert-threshold"
          type="number"
          step="0.01"
          min="0"
          required
          value={form.thresholdPrice}
          onChange={(e) => onChange("thresholdPrice", e.target.value)}
          placeholder="Örn: 45.00"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <span className={LABEL_CLASS}>Yön</span>
        <div className="grid grid-cols-2 gap-2">
          <DirectionButton
            active={form.direction === "below"}
            onClick={() => onChange("direction", "below" as AlertDirection)}
            icon="▼"
            label="Altına düşünce"
            color="success"
          />
          <DirectionButton
            active={form.direction === "above"}
            onClick={() => onChange("direction", "above" as AlertDirection)}
            icon="▲"
            label="Üstüne çıkınca"
            color="danger"
          />
        </div>
      </div>

      <div>
        <span className={LABEL_CLASS}>Bildirim Türü</span>
        <div className="mb-2 inline-flex w-full items-center gap-1 rounded-lg bg-(--color-bg-alt) p-1">
          <ChannelTab
            active={form.channel === "email"}
            onClick={() => onChange("channel", "email")}
            label="E-posta"
          />
          <ChannelTab
            active={form.channel === "telegram"}
            onClick={() => onChange("channel", "telegram")}
            label="Telegram"
          />
          <ChannelTab
            active={form.channel === "push"}
            onClick={() => onChange("channel", "push")}
            label="Web (Push)"
          />
        </div>
        {form.channel === "email" ? (
          <input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => onChange("contactEmail", e.target.value)}
            placeholder="ornek@mail.com"
            className={INPUT_CLASS}
          />
        ) : form.channel === "telegram" ? (
          <div className="space-y-2">
            <input
              type="text"
              required
              value={form.contactTelegram}
              onChange={(e) => onChange("contactTelegram", e.target.value)}
              placeholder="Sayısal Chat ID (Örn: 123456789)"
              className={INPUT_CLASS}
            />
            <div className="flex flex-col gap-1.5 px-1 text-[11px] leading-relaxed text-(--color-muted)">
              <p>
                1. Önce{" "}
                <a
                  href="https://t.me/haldefiyat_fiyat_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-(--color-brand) underline"
                >
                  @haldefiyat_fiyat_bot
                </a>{" "}
                botunu başlatın.
              </p>
              <p>
                2. Sayısal ID'nizi{" "}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-(--color-foreground) underline"
                >
                  @userinfobot
                </a>{" "}
                aracılığıyla öğrenip buraya yazın.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-(--color-border) bg-(--color-bg-alt)/50 p-3 text-[12px] text-(--color-muted)">
            Tarayıcı bildirimleri, bu cihaz üzerinden OneSignal altyapısı ile anlık olarak iletilecektir.
          </div>
        )}
      </div>
    </div>
  );
}

interface DirectionButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  color: "success" | "danger";
}

function DirectionButton({ active, onClick, icon, label, color }: DirectionButtonProps) {
  const activeClass =
    color === "success"
      ? "border-(--color-success) bg-(--color-success)/10 text-(--color-success)"
      : "border-(--color-danger) bg-(--color-danger)/10 text-(--color-danger)";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] font-semibold transition-all " +
        (active
          ? activeClass
          : "border-(--color-border) text-(--color-muted) hover:border-(--color-border-soft) hover:text-(--color-foreground)")
      }
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function ChannelTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors " +
        (active
          ? "bg-(--color-brand) text-(--color-navy)"
          : "text-(--color-muted) hover:text-(--color-foreground)")
      }
    >
      {label}
    </button>
  );
}
