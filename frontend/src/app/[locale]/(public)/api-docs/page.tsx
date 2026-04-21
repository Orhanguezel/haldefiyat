import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "API Dokümantasyonu",
    description: "HaldeFiyat açık API — fiyat verileri, hal listesi, haftalık endeks ve daha fazlası.",
    robots: { index: false },
  };
}

const BASE = "https://haldefiyat.com/api/v1";

type Method = "GET" | "POST" | "DELETE" | "PATCH";

interface Endpoint {
  method: Method;
  path: string;
  desc: string;
  params?: { name: string; type: string; required?: boolean; desc: string }[];
  example?: string;
  response?: string;
  auth?: boolean;
  cache?: string;
}

interface Group {
  id: string;
  title: string;
  desc: string;
  endpoints: Endpoint[];
}

const GROUPS: Group[] = [
  {
    id: "prices",
    title: "Fiyat Verileri",
    desc: "Hal fiyatlarını sorgulama, filtreleme ve dışa aktarma.",
    endpoints: [
      {
        method: "GET",
        path: "/prices",
        desc: "Fiyat listesini döndürür. Şehir, kategori, tarih ve ürün bazında filtrelenebilir.",
        params: [
          { name: "city", type: "string", desc: "Şehir adı veya kodu (örn. istanbul)" },
          { name: "product", type: "string", desc: "Ürün slug'ı (örn. domates)" },
          { name: "category", type: "string", desc: "Kategori slug'ı (örn. sebze)" },
          { name: "dateFrom", type: "string", desc: "Başlangıç tarihi YYYY-MM-DD" },
          { name: "dateTo", type: "string", desc: "Bitiş tarihi YYYY-MM-DD" },
          { name: "page", type: "number", desc: "Sayfa no (varsayılan: 1)" },
          { name: "limit", type: "number", desc: "Sayfa boyutu (maks. 100)" },
        ],
        example: `curl "${BASE}/prices?city=istanbul&product=domates&limit=5"`,
        response: `{
  "data": [
    {
      "id": "...",
      "marketName": "İstanbul Büyükçekmece Hali",
      "productName": "Domates",
      "minPrice": "8.50",
      "maxPrice": "12.00",
      "avgPrice": "10.25",
      "unit": "kg",
      "priceDate": "2026-04-21"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 5
}`,
        cache: "5 dakika",
      },
      {
        method: "GET",
        path: "/prices/trending",
        desc: "Son 7 günde en çok işlem gören ürünlerin fiyat özeti.",
        params: [
          { name: "limit", type: "number", desc: "Sonuç sayısı (varsayılan: 20)" },
        ],
        example: `curl "${BASE}/prices/trending?limit=10"`,
        response: `[
  {
    "productSlug": "domates",
    "productName": "Domates",
    "avgPrice": "10.25",
    "minPrice": "8.50",
    "maxPrice": "14.00",
    "recordCount": 284
  }
]`,
        cache: "10 dakika",
      },
      {
        method: "GET",
        path: "/prices/weekly-summary",
        desc: "Haftalık fiyat özeti — her ürün için min/max/ort ve hafta bazlı gruplandırma.",
        params: [
          { name: "product", type: "string", desc: "Ürün slug'ı" },
          { name: "weeks", type: "number", desc: "Kaç haftalık geçmiş (varsayılan: 8)" },
        ],
        example: `curl "${BASE}/prices/weekly-summary?product=domates&weeks=4"`,
        response: `[
  {
    "isoWeek": "2026-16",
    "weekStart": "2026-04-14",
    "avgPrice": "10.25",
    "minPrice": "8.00",
    "maxPrice": "14.50",
    "recordCount": 68
  }
]`,
      },
      {
        method: "GET",
        path: "/prices/:productSlug/history",
        desc: "Belirli bir ürünün günlük fiyat geçmişi.",
        params: [
          { name: "productSlug", type: "string", required: true, desc: "URL'de ürün slug'ı" },
          { name: "days", type: "number", desc: "Kaç günlük geçmiş (varsayılan: 30)" },
        ],
        example: `curl "${BASE}/prices/domates/history?days=14"`,
        response: `[
  { "priceDate": "2026-04-21", "avgPrice": "10.25", "minPrice": "8.50", "maxPrice": "14.00" }
]`,
      },
      {
        method: "GET",
        path: "/prices/export",
        desc: "Fiyat verilerini CSV olarak indirir. Tüm filtreler geçerlidir.",
        params: [
          { name: "city", type: "string", desc: "Şehir filtresi" },
          { name: "product", type: "string", desc: "Ürün filtresi" },
          { name: "dateFrom", type: "string", desc: "Başlangıç tarihi" },
          { name: "dateTo", type: "string", desc: "Bitiş tarihi" },
        ],
        example: `curl -o fiyatlar.csv "${BASE}/prices/export?city=istanbul&dateFrom=2026-04-01"`,
        response: `market_name,product_name,min_price,max_price,avg_price,unit,price_date
İstanbul Büyükçekmece Hali,Domates,8.50,14.00,10.25,kg,2026-04-21`,
      },
      {
        method: "GET",
        path: "/prices/forecast/:productSlug",
        desc: "Yapay zeka destekli 7 günlük fiyat tahmini.",
        params: [
          { name: "productSlug", type: "string", required: true, desc: "URL'de ürün slug'ı" },
        ],
        example: `curl "${BASE}/prices/forecast/domates"`,
        response: `{
  "productSlug": "domates",
  "forecast": [
    { "date": "2026-04-22", "predictedAvg": 10.8, "confidence": 0.74 }
  ]
}`,
      },
    ],
  },
  {
    id: "index",
    title: "HaldeFiyat Endeksi",
    desc: "15 temel tarım ürününden oluşan haftalık fiyat endeksi.",
    endpoints: [
      {
        method: "GET",
        path: "/index/latest",
        desc: "En güncel endeks değerini döndürür.",
        example: `curl "${BASE}/index/latest"`,
        response: `{
  "indexWeek": "2026-16",
  "indexValue": "98.81",
  "baseWeek": "2026-14",
  "basketAvg": "12.34",
  "productsCount": 13,
  "weekStart": "2026-04-14",
  "weekEnd": "2026-04-20"
}`,
        cache: "5 dakika",
      },
      {
        method: "GET",
        path: "/index/history",
        desc: "Endeks geçmişi — varsayılan 26 hafta.",
        params: [
          { name: "weeks", type: "number", desc: "Kaç haftalık geçmiş (maks. 104)" },
        ],
        example: `curl "${BASE}/index/history?weeks=8"`,
        response: `[
  { "indexWeek": "2026-14", "indexValue": "100.00", "basketAvg": "12.48", "productsCount": 13 },
  { "indexWeek": "2026-15", "indexValue": "98.81",  "basketAvg": "12.34", "productsCount": 13 }
]`,
        cache: "5 dakika",
      },
      {
        method: "GET",
        path: "/index/basket",
        desc: "Endeks sepetindeki ürün listesi.",
        example: `curl "${BASE}/index/basket"`,
        response: `{
  "basket": [
    { "slug": "domates", "label": "Domates" },
    { "slug": "biber",   "label": "Biber" }
  ]
}`,
      },
    ],
  },
  {
    id: "markets",
    title: "Hal Listesi",
    desc: "Türkiye genelindeki aktif hal ve pazar bilgileri.",
    endpoints: [
      {
        method: "GET",
        path: "/markets",
        desc: "Tüm aktif hallerin listesi.",
        params: [
          { name: "city", type: "string", desc: "Şehir filtresi" },
        ],
        example: `curl "${BASE}/markets"`,
        response: `[
  {
    "id": "...",
    "name": "İstanbul Büyükçekmece Hali",
    "slug": "istanbul-buyukcekmece-hali",
    "city": "İstanbul",
    "isActive": true
  }
]`,
      },
    ],
  },
  {
    id: "production",
    title: "Yıllık Üretim",
    desc: "TÜİK kaynaklı yıllık tarımsal üretim verileri.",
    endpoints: [
      {
        method: "GET",
        path: "/production",
        desc: "Ürün bazlı yıllık üretim miktarları.",
        params: [
          { name: "product", type: "string", desc: "Ürün adı" },
          { name: "year", type: "number", desc: "Yıl filtresi" },
        ],
        example: `curl "${BASE}/production?product=domates&year=2024"`,
        response: `[
  { "year": 2024, "productName": "Domates", "quantityTons": 13200000, "source": "TÜİK" }
]`,
      },
    ],
  },
  {
    id: "alerts",
    title: "Fiyat Uyarıları",
    desc: "Hedef fiyat belirle, ürün o fiyata ulaştığında bildirim al.",
    endpoints: [
      {
        method: "GET",
        path: "/alerts",
        desc: "Kayıtlı e-posta'ya ait uyarı listesi.",
        params: [
          { name: "email", type: "string", required: true, desc: "Uyarı kaydedilmiş e-posta" },
        ],
        example: `curl "${BASE}/alerts?email=ornek@mail.com"`,
        response: `[
  {
    "id": "...",
    "productName": "Domates",
    "targetPrice": "9.00",
    "direction": "below",
    "isActive": true
  }
]`,
      },
      {
        method: "POST",
        path: "/alerts",
        desc: "Yeni fiyat uyarısı oluşturur.",
        example: `curl -X POST "${BASE}/alerts" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"ornek@mail.com","productSlug":"domates","targetPrice":9,"direction":"below"}'`,
        response: `{ "id": "...", "created": true }`,
      },
      {
        method: "DELETE",
        path: "/alerts/:id",
        desc: "Uyarıyı siler.",
        params: [
          { name: "id", type: "string", required: true, desc: "URL'de uyarı ID" },
        ],
        example: `curl -X DELETE "${BASE}/alerts/abc-123"`,
        response: `{ "deleted": true }`,
      },
    ],
  },
];

const METHOD_COLORS: Record<Method, string> = {
  GET:    "bg-brand/15 text-brand border-brand/25",
  POST:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  PATCH:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default async function ApiDocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-350 px-8 py-12">
      {/* Başlık */}
      <div className="mb-12 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
          Geliştirici
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground">API Dokümantasyonu</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          HaldeFiyat API'si REST tabanlıdır, JSON döndürür ve kimlik doğrulama gerektirmeyen
          endpoint'ler için API anahtarı gerekmez.
        </p>
      </div>

      {/* Temel Bilgiler */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Base URL", value: BASE },
          { label: "Format", value: "JSON (UTF-8)" },
          { label: "Rate Limit", value: "120 istek / dakika" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint mb-1">{item.label}</p>
            <p className="font-mono text-[13px] text-foreground break-all">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Gruplar */}
      <div className="space-y-16">
        {GROUPS.map((group) => (
          <section key={group.id} id={group.id}>
            <div className="mb-6 border-b border-border pb-4">
              <h2 className="font-display text-2xl font-bold text-foreground">{group.title}</h2>
              <p className="mt-1 text-[14px] text-muted">{group.desc}</p>
            </div>

            <div className="space-y-6">
              {group.endpoints.map((ep) => (
                <div key={ep.path + ep.method} className="rounded-2xl border border-border bg-surface overflow-hidden">
                  {/* Başlık satırı */}
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border/60">
                    <span className={`rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wide ${METHOD_COLORS[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className="font-mono text-[13px] text-foreground">{ep.path}</code>
                    {ep.auth && (
                      <span className="ml-auto rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-400">
                        🔒 Auth gerekli
                      </span>
                    )}
                    {ep.cache && (
                      <span className="ml-auto rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] text-faint">
                        Cache: {ep.cache}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-5">
                    <p className="text-[14px] text-muted">{ep.desc}</p>

                    {/* Parametreler */}
                    {ep.params && ep.params.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint mb-2">Parametreler</p>
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full text-[13px]">
                            <thead>
                              <tr className="border-b border-border bg-surface">
                                <th className="px-4 py-2.5 text-left font-medium text-muted">İsim</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted">Tür</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted">Zorunlu</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted">Açıklama</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ep.params.map((p) => (
                                <tr key={p.name} className="border-b border-border/50 last:border-0">
                                  <td className="px-4 py-2.5 font-mono text-foreground">{p.name}</td>
                                  <td className="px-4 py-2.5 text-brand">{p.type}</td>
                                  <td className="px-4 py-2.5 text-muted">{p.required ? "evet" : "hayır"}</td>
                                  <td className="px-4 py-2.5 text-muted">{p.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Örnek istek */}
                    {ep.example && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint mb-2">Örnek İstek</p>
                        <pre className="overflow-x-auto rounded-xl border border-border bg-background px-4 py-3 font-mono text-[12px] text-foreground leading-relaxed whitespace-pre">
                          {ep.example}
                        </pre>
                      </div>
                    )}

                    {/* Örnek yanıt */}
                    {ep.response && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint mb-2">Örnek Yanıt</p>
                        <pre className="overflow-x-auto rounded-xl border border-border bg-background px-4 py-3 font-mono text-[12px] text-muted leading-relaxed whitespace-pre">
                          {ep.response}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Widget embed notu */}
      <section id="widget" className="mt-16 rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">Endeks Widget</h2>
        <p className="text-[14px] text-muted">
          HaldeFiyat Endeksi'ni kendi sitenize iframe olarak ekleyebilirsiniz.
          Koyu ve açık tema desteği mevcuttur.
        </p>
        <div className="space-y-2">
          {[
            { label: "Koyu tema", code: `<iframe src="https://haldefiyat.com/endeks/widget" width="320" height="168" style="border:none;border-radius:14px;" title="HaldeFiyat Endeksi"></iframe>` },
            { label: "Açık tema", code: `<iframe src="https://haldefiyat.com/endeks/widget?theme=light" width="320" height="168" style="border:none;border-radius:14px;" title="HaldeFiyat Endeksi"></iframe>` },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[11px] text-faint mb-1">{item.label}</p>
              <pre className="overflow-x-auto rounded-xl border border-border bg-background px-4 py-3 font-mono text-[12px] text-foreground whitespace-pre">
                {item.code}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Notlar */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-6 space-y-2 text-[13px] text-muted">
        <p className="font-semibold text-foreground">Notlar</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tüm yanıtlar <code className="text-foreground">UTF-8</code> kodlamasında JSON'dır.</li>
          <li>Tarih formatı <code className="text-foreground">YYYY-MM-DD</code>, hafta formatı <code className="text-foreground">YYYY-WW</code> (ISO 8601).</li>
          <li>Cache başlıkları içeren endpoint'ler CDN veya servis worker ile önbelleklenebilir.</li>
          <li>Yüksek hacimli entegrasyonlar için <a href="/iletisim" className="text-brand underline underline-offset-2">iletişime geçin</a>.</li>
        </ul>
      </section>
    </div>
  );
}
