"use client";

import type { FirmPrice } from "@/lib/api";
import type { FirmPriceInput, PriceValidationResult } from "@/lib/firm-price-validation";

type PriceRow = FirmPrice | FirmPriceInput;

type Props = {
  prices: PriceRow[];
  previewRows?: PriceValidationResult[];
  onEdit?: (row: PriceRow, index: number) => void;
  onDelete?: (indexOrId: number) => void;
  deleteBy?: "index" | "id";
};

export function FirmPricesTable({ prices, previewRows, onEdit, onDelete, deleteBy = "id" }: Props) {
  return (
    <div className="mt-4 overflow-x-auto rounded-[8px] border border-(--color-border-soft)">
      <table className="min-w-[520px] w-full text-left text-sm">
        <thead className="bg-(--color-bg-alt) font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.08em] text-(--color-muted)">
          <tr>
            <th className="px-4 py-3">Ürün</th>
            <th className="px-4 py-3">Birim</th>
            <th className="px-4 py-3">Fiyat</th>
            <th className="px-4 py-3">Tarih</th>
            {previewRows && <th className="px-4 py-3">Durum</th>}
            <th className="px-4 py-3 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--color-border-soft)">
          {prices.length === 0 ? (
            <tr><td colSpan={previewRows ? 6 : 5} className="px-4 py-5 text-center text-(--color-muted)">Henüz günlük fiyat girilmedi.</td></tr>
          ) : prices.map((price, index) => {
            const id = "id" in price ? price.id : index;
            const preview = previewRows?.[index];
            return (
              <tr key={`${price.productName}-${price.recordedDate}-${id}`} className={preview && !preview.ok ? "bg-red-50/60" : ""}>
                <td className="px-4 py-3 font-semibold text-(--color-foreground)">{price.productName}</td>
                <td className="px-4 py-3 text-(--color-muted)">{price.unit}</td>
                <td className="px-4 py-3 font-semibold text-(--color-foreground)">{price.avgPrice}</td>
                <td className="px-4 py-3 text-(--color-muted)">{price.recordedDate}</td>
                {previewRows && (
                  <td className={`px-4 py-3 ${preview?.ok ? "text-emerald-700" : "text-red-700"}`}>
                    {preview?.ok ? "Geçerli" : preview?.errors.join(" ")}
                  </td>
                )}
                <td className="space-x-2 px-4 py-3 text-right">
                  {onEdit && <button type="button" onClick={() => onEdit(price, index)} className="rounded-[6px] border border-(--color-border) px-3 py-1.5 text-xs text-(--color-muted)">Düzenle</button>}
                  {onDelete && <button type="button" onClick={() => onDelete(deleteBy === "id" ? Number(id) : index)} className="rounded-[6px] border border-(--color-border) px-3 py-1.5 text-xs text-(--color-muted)">Sil</button>}
                  {!onEdit && !onDelete ? "-" : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
