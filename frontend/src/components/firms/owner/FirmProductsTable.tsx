"use client";

import type { FirmProduct } from "@/lib/api";
import type { FirmProductInput, ProductValidationResult } from "@/lib/firm-product-validation";

type ProductRow = FirmProduct | FirmProductInput;

type Props = {
  products: ProductRow[];
  previewRows?: ProductValidationResult[];
  onDelete?: (indexOrId: number) => void;
  deleteBy?: "index" | "id";
};

export function FirmProductsTable({ products, previewRows, onDelete, deleteBy = "id" }: Props) {
  return (
    <div className="mt-4 overflow-x-auto rounded-[8px] border border-(--color-border-soft)">
      <table className="min-w-[680px] w-full text-left text-sm">
        <thead className="bg-(--color-bg-alt) font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.08em] text-(--color-muted)">
          <tr>
            <th className="px-4 py-3">Ürün Adı</th>
            <th className="px-4 py-3">Fiyat/Not</th>
            <th className="px-4 py-3">Açıklama</th>
            {previewRows && <th className="px-4 py-3">Durum</th>}
            <th className="px-4 py-3 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--color-border-soft)">
          {products.length === 0 ? (
            <tr><td colSpan={previewRows ? 5 : 4} className="px-4 py-5 text-center text-(--color-muted)">Henüz ürün eklenmedi.</td></tr>
          ) : products.map((product, index) => {
            const id = "id" in product ? product.id : index;
            const preview = previewRows?.[index];
            return (
              <tr key={`${product.productName}-${id}`} className={preview && !preview.ok ? "bg-red-50/60" : ""}>
                <td className="px-4 py-3 font-semibold text-(--color-foreground)">{product.productName}</td>
                <td className="px-4 py-3 text-(--color-muted)">{product.price || "-"}</td>
                <td className="px-4 py-3 text-(--color-muted)">{product.note || "-"}</td>
                {previewRows && (
                  <td className={`px-4 py-3 ${preview?.ok ? "text-emerald-700" : "text-red-700"}`}>
                    {preview?.ok ? "Geçerli" : preview?.errors.join(" ")}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(deleteBy === "id" ? Number(id) : index)}
                      className="rounded-[6px] border border-(--color-border) px-3 py-1.5 text-xs text-(--color-muted)"
                    >
                      Sil
                    </button>
                  ) : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
