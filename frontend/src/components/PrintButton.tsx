"use client";

export default function PrintButton({ label = "🖨️ PDF Olarak İndir" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-emerald-500 text-white px-5 py-2 text-sm font-medium hover:bg-emerald-600 transition"
    >
      {label}
    </button>
  );
}
