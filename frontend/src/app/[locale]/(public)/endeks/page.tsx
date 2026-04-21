import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { fetchIndexLatest, fetchIndexHistory, type IndexSnapshot } from "@/lib/api";
import { INDEX_BASKET_LABELS } from "@/lib/index-basket";

type Props = { params: Promise<{ locale: string }> };

// DB date/datetime sütunları bazen ISO string olarak dönebilir — sadece YYYY-MM-DD al
function toDateStr(d: string): string {
  return String(d).slice(0, 10);
}

export function generateMetadata(): Metadata {
  return {
    title: "HaldeFiyat Endeksi",
    description:
      "Türkiye hal fiyatlarının haftalık sepet endeksi. Baz haftaya göre değişimi izleyin.",
    openGraph: {
      title: "HaldeFiyat Endeksi | Haftalık Fiyat Endeksi",
      description: "15 temel tarım ürününden oluşan ağırlıksız hal fiyatları endeksi.",
      type: "website",
    },
  };
}

export default async function EndeksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [latest, history] = await Promise.all([
    fetchIndexLatest(),
    fetchIndexHistory(26),
  ]);

  const currentValue = latest ? parseFloat(latest.indexValue) : null;
  const prevSnapshot = history.length >= 2 ? history[history.length - 2] : null;
  const prevValue    = prevSnapshot ? parseFloat(prevSnapshot.indexValue) : null;
  const weeklyChange = currentValue !== null && prevValue !== null
    ? Math.round((currentValue - prevValue) * 100) / 100
    : null;

  return (
    <div className="mx-auto max-w-350 px-8 py-12 space-y-10">
      {/* Başlık */}
      <div>
        <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
          HaldeFiyat Endeksi
        </h1>
        <p className="mt-2 text-[14px] text-(--color-muted) max-w-2xl">
          15 temel tarım ürününden oluşan haftalık sepet endeksi. Baz haftaya (ilk ölçüm) göre
          fiyat hareketini izler.
        </p>
      </div>

      {/* Büyük değer kartı */}
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-8">
        {latest ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-widest text-(--color-muted)">
                Güncel Endeks — {latest.indexWeek.replace("-", " / Hafta ")}
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-(family-name:--font-display) text-5xl font-bold text-(--color-foreground)">
                  {parseFloat(latest.indexValue).toFixed(2)}
                </span>
                {weeklyChange !== null && (
                  <span
                    className={`text-[15px] font-semibold ${
                      weeklyChange >= 0
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {weeklyChange >= 0 ? "▲" : "▼"} {Math.abs(weeklyChange).toFixed(2)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-(--color-muted)">
                Baz hafta: <strong className="text-(--color-foreground)">{latest.baseWeek}</strong>
                {" · "}Sepet ort.: <strong className="text-(--color-foreground)">
                  {parseFloat(latest.basketAvg).toFixed(2)} ₺/kg
                </strong>
                {" · "}Ürün sayısı: <strong className="text-(--color-foreground)">
                  {latest.productsCount}
                </strong>
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[11px] text-(--color-muted)">
                {toDateStr(latest.weekStart)} — {toDateStr(latest.weekEnd)}
              </p>
              <p className="mt-0.5 text-[11px] text-(--color-muted)">Son güncelleme: pazartesi</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-(--color-muted) text-[14px]">
              Henüz endeks verisi yok. İlk haftalık ETL çalıştıktan sonra burada görünecek.
            </p>
          </div>
        )}
      </div>

      {/* Trend grafiği */}
      {history.length >= 2 && (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground) mb-5">
            Haftalık Trend
          </h2>
          <IndexChart snapshots={history} />
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {history.slice(-6).map((s) => (
              <div key={s.indexWeek} className="flex items-baseline gap-1.5 text-[11px]">
                <span className="text-(--color-muted)">{s.indexWeek}</span>
                <span className="font-semibold text-(--color-foreground)">
                  {parseFloat(s.indexValue).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endeks tablosu */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
          <div className="px-6 py-4 border-b border-(--color-border)">
            <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
              Haftalık Endeks Tablosu
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-(--color-border) text-(--color-muted) text-left">
                  <th className="px-5 py-3 font-medium">Hafta</th>
                  <th className="px-5 py-3 font-medium">Endeks</th>
                  <th className="px-5 py-3 font-medium">Sepet Ort.</th>
                  <th className="px-5 py-3 font-medium">Ürün Sayısı</th>
                  <th className="px-5 py-3 font-medium">Tarih Aralığı</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((s, i) => {
                  const val  = parseFloat(s.indexValue);
                  const prev = i < history.length - 1
                    ? parseFloat(history[history.length - 2 - i]?.indexValue ?? "0")
                    : null;
                  const delta = prev !== null ? val - prev : null;
                  return (
                    <tr key={s.indexWeek} className="border-b border-(--color-border)/50 hover:bg-(--color-border)/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-(--color-foreground)">{s.indexWeek}</td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-(--color-foreground)">{val.toFixed(2)}</span>
                        {delta !== null && (
                          <span className={`ml-2 text-[11px] ${delta >= 0 ? "text-red-500" : "text-green-500"}`}>
                            {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-(--color-muted)">{parseFloat(s.basketAvg).toFixed(2)} ₺/kg</td>
                      <td className="px-5 py-3 text-(--color-muted)">{s.productsCount}</td>
                      <td className="px-5 py-3 text-(--color-muted) text-[12px]">{toDateStr(s.weekStart)} / {toDateStr(s.weekEnd)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Widget Embed */}
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 space-y-5">
        <div>
          <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
            Sitenize Ekleyin
          </h2>
          <p className="mt-1 text-[13px] text-(--color-muted)">
            HaldeFiyat Endeksi'ni kendi sitenize veya blogunuza bir iframe olarak ekleyebilirsiniz.
          </p>
        </div>

        {/* Önizleme */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="shrink-0">
            <p className="text-[11px] font-medium text-(--color-muted) mb-2 uppercase tracking-wider">Koyu tema</p>
            <iframe
              src="/endeks/widget?theme=dark"
              width="320"
              height="168"
              style={{ border: "none", borderRadius: "14px", display: "block" }}
              title="HaldeFiyat Endeksi — Koyu"
            />
          </div>
          <div className="shrink-0">
            <p className="text-[11px] font-medium text-(--color-muted) mb-2 uppercase tracking-wider">Açık tema</p>
            <iframe
              src="/endeks/widget?theme=light"
              width="320"
              height="168"
              style={{ border: "none", borderRadius: "14px", display: "block" }}
              title="HaldeFiyat Endeksi — Açık"
            />
          </div>
        </div>

        {/* Embed kodları */}
        <div className="space-y-3">
          <EmbedCode
            label="Koyu tema (varsayılan)"
            code={`<iframe\n  src="https://haldefiyat.com/endeks/widget"\n  width="320"\n  height="168"\n  style="border:none;border-radius:14px;"\n  title="HaldeFiyat Endeksi"\n></iframe>`}
          />
          <EmbedCode
            label="Açık tema"
            code={`<iframe\n  src="https://haldefiyat.com/endeks/widget?theme=light"\n  width="320"\n  height="168"\n  style="border:none;border-radius:14px;"\n  title="HaldeFiyat Endeksi"\n></iframe>`}
          />
        </div>
      </div>

      {/* Metodoloji */}
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 space-y-4">
        <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
          Metodoloji
        </h2>
        <div className="space-y-3 text-[13px] text-(--color-muted) leading-relaxed">
          <p>
            <strong className="text-(--color-foreground)">Baz hafta:</strong> Sistemin ilk haftalık
            verisinin bulunduğu hafta — bu hafta endeks değeri 100'dür.
          </p>
          <p>
            <strong className="text-(--color-foreground)">Hesaplama:</strong> Her haftanın endeks değeri,
            sepet ürünlerinin o haftaki tüm hallerdeki ortalama fiyatlarının aritmetik ortalamasının,
            baz hafta ortalamasına oranıyla hesaplanır.
          </p>
          <p>
            <strong className="text-(--color-foreground)">Yorum:</strong> 100 üzeri değerler, baz haftaya
            göre fiyat seviyesinin yükseldiğini; 100 altı değerler düştüğünü gösterir. Haftalık değişim
            ise bir önceki haftaya göre hareketi yansıtır.
          </p>
          <p>
            <strong className="text-(--color-foreground)">Güncelleme:</strong> Endeks her pazartesi
            sabahı otomatik hesaplanır.
          </p>
        </div>

        {/* Sepet ürünleri */}
        <div className="mt-2">
          <p className="text-[12px] font-medium text-(--color-muted) mb-2">Sepetteki Ürünler ({INDEX_BASKET_LABELS.length})</p>
          <div className="flex flex-wrap gap-2">
            {INDEX_BASKET_LABELS.map((label) => (
              <span
                key={label}
                className="rounded-full border border-(--color-border) px-3 py-0.5 text-[12px] text-(--color-muted)"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedCode({ label, code }: { label: string; code: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-(--color-muted)">{label}</p>
      <div className="relative rounded-xl border border-(--color-border) bg-(--color-background) px-4 py-3">
        <pre className="overflow-x-auto text-[12px] text-(--color-foreground) leading-relaxed whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

function IndexChart({ snapshots }: { snapshots: IndexSnapshot[] }) {
  const values = snapshots.map((s) => parseFloat(s.indexValue));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 600;
  const H = 120;
  const PAD = 16;

  const points = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const baseY    = PAD + (1 - (100 - min) / range) * (H - PAD * 2);
  const clampedBaseY = Math.max(PAD, Math.min(H - PAD, baseY));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-[120px]"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {/* Baz çizgisi (100) */}
      <line
        x1={PAD} y1={clampedBaseY}
        x2={W - PAD} y2={clampedBaseY}
        stroke="var(--color-brand)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.4"
      />
      {/* Trend çizgisi */}
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Son nokta */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1]!.split(",")[0]}
          cy={points[points.length - 1]!.split(",")[1]}
          r="4"
          fill="var(--color-brand)"
        />
      )}
    </svg>
  );
}
