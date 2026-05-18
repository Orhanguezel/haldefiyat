"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// Analiz içeriğinde [[CHART:elma]] token'ı bu bileşene dönüşür.
// Tüm seriler server tarafında canlı API'den çekilip prop ile gelir;
// fiyat zinciri TZOB Nisan 2026 referansıdır (aylık resmi kaynak).

export interface ElmaChartData {
  cesitler: { ad: string; fiyat: number }[];
  trend: { tarih: string; fiyat: number }[];
  bolgesel: { sehir: string; fiyat: number }[];
  zincir: { asama: string; fiyat: number }[];
}

const BRAND = "var(--color-brand)";
const MUTED = "var(--color-muted)";

function Card({ baslik, not, children }: { baslik: string; not?: string; children: React.ReactNode }) {
  return (
    <figure className="my-6 rounded-[16px] border border-(--color-border) bg-(--color-bg-alt) p-5">
      <figcaption className="mb-4">
        <div className="font-(family-name:--font-display) text-[15px] font-bold text-(--color-foreground)">
          {baslik}
        </div>
        {not && <div className="mt-1 text-[12px] text-(--color-muted)">{not}</div>}
      </figcaption>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

const axis = { stroke: MUTED, fontSize: 12 };
const tip = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    fontSize: 12,
  },
  formatter: (v: number) => [`₺${Number(v).toFixed(2)}`, "Fiyat"],
};

export default function AnalizElmaCharts({ data }: { data: ElmaChartData }) {
  return (
    <div>
      <Card
        baslik="Çeşit bazında güncel ortalama (₺/kg)"
        not="Canlı hal verisi — çeşitler arası ayrışma mevsim sonu stok hikâyesinin kanıtı."
      >
        <BarChart data={data.cesitler} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
          <XAxis dataKey="ad" {...axis} />
          <YAxis {...axis} width={44} />
          <Tooltip {...tip} />
          <Bar dataKey="fiyat" radius={[6, 6, 0, 0]}>
            {data.cesitler.map((_, i) => (
              <Cell key={i} fill={BRAND} fillOpacity={0.45 + (i % 3) * 0.2} />
            ))}
          </Bar>
        </BarChart>
      </Card>

      <Card
        baslik="Golden elma — son 30 gün ulusal ortalama (₺/kg)"
        not="Mayıs sonu soğuk hava deposu sezonu biterken kaliteli stok eridikçe yukarı yönlü baskı."
      >
        <LineChart data={data.trend} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
          <XAxis dataKey="tarih" {...axis} minTickGap={28} />
          <YAxis {...axis} width={44} domain={["auto", "auto"]} />
          <Tooltip {...tip} />
          <Line type="monotone" dataKey="fiyat" stroke={BRAND} strokeWidth={2.5} dot={false} />
        </LineChart>
      </Card>

      <Card
        baslik="Fiyat zinciri makası — tarladan rafa (₺/kg)"
        not="TZOB Nisan 2026 raporu: üretici ₺18,75 → hal ortalaması → market ₺92,58 (≈5 kat, tüm üründe en geniş makas: %393,7)."
      >
        <BarChart data={data.zincir} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" horizontal={false} />
          <XAxis type="number" {...axis} />
          <YAxis type="category" dataKey="asama" {...axis} width={92} />
          <Tooltip {...tip} />
          <Bar dataKey="fiyat" radius={[0, 6, 6, 0]}>
            {data.zincir.map((_, i) => (
              <Cell key={i} fill={BRAND} fillOpacity={0.4 + i * 0.3} />
            ))}
          </Bar>
        </BarChart>
      </Card>

      <Card
        baslik="Bölgesel parçalanma — Golden elma, şehir bazlı (₺/kg)"
        not="Aynı gün şehirler arası fark donun yarattığı arz kırılmasını gösteriyor; 'ulusal ortalama' bu tabloyu gizler."
      >
        <BarChart data={data.bolgesel} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
          <XAxis dataKey="sehir" {...axis} interval={0} angle={-30} textAnchor="end" height={56} />
          <YAxis {...axis} width={44} />
          <Tooltip {...tip} />
          <Bar dataKey="fiyat" fill={BRAND} fillOpacity={0.7} radius={[6, 6, 0, 0]} />
        </BarChart>
      </Card>
    </div>
  );
}
