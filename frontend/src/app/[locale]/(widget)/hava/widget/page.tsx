'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const TARIMIKLIM_API = 'https://tarimiklim.com/api/v1';

interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
}

interface ForecastDay {
  date: string;
  forecastDate?: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  frostRisk: number;
}

interface WidgetData {
  location: { name: string; city?: string };
  current: CurrentWeather;
  forecast: ForecastDay[];
}

function frostColor(score: number) {
  if (score >= 60) return '#dc2626';
  if (score >= 25) return '#ea580c';
  return '#16a34a';
}

function frostLabel(score: number) {
  if (score >= 60) return 'Yüksek don riski';
  if (score >= 25) return 'Orta don riski';
  return 'Don riski yok';
}

function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function WidgetContent({ location }: { location: string }) {
  const [data, setData] = useState<WidgetData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(`${TARIMIKLIM_API}/weather/widget-data`);
    if (location && location !== 'auto') url.searchParams.set('location', location);
    fetch(url.toString())
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setData(json?.data ?? null); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [location]);

  const c = {
    bg: '#f0f4f8', card: '#ffffff', border: '#d0dae5',
    text: '#1a2b3c', textMuted: '#5a6b7c', primary: '#2c5282',
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: c.bg, borderRadius: 12, border: `1px solid ${c.border}`,
    padding: '1rem', minWidth: 200, maxWidth: 280, color: c.text,
  };

  if (loading) return <div style={containerStyle}><p style={{ margin: 0, fontSize: '0.85rem', color: c.textMuted }}>Yükleniyor…</p></div>;
  if (error || !data) return <div style={containerStyle}><p style={{ margin: 0, fontSize: '0.85rem', color: '#dc2626' }}>Hava verisi alınamadı.</p></div>;

  const maxFrost = Math.max(...data.forecast.map((f) => f.frostRisk ?? 0));

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: c.textMuted }}>Hava Durumu</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{data.location.city ?? data.location.name}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color: c.primary }}>{Math.round(data.current.temp)}°</span>
        <span style={{ fontSize: '0.8rem', color: c.textMuted }}>Hissedilen {Math.round(data.current.feelsLike)}°</span>
      </div>

      <div style={{ fontSize: '0.8rem', color: c.textMuted, marginBottom: '0.75rem', textTransform: 'capitalize' }}>
        {data.current.condition} · Nem %{data.current.humidity} · {data.current.windSpeed.toFixed(1)} m/s
      </div>

      {maxFrost > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: frostColor(maxFrost) + '18', border: `1px solid ${frostColor(maxFrost)}40`,
          borderRadius: 8, padding: '0.35rem 0.6rem', marginBottom: '0.75rem',
          fontSize: '0.78rem', fontWeight: 600, color: frostColor(maxFrost),
        }}>
          <span>❄</span><span>{frostLabel(maxFrost)} ({maxFrost}/100)</span>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {data.forecast.slice(0, 3).map((f, i) => {
          const dk = f.date ?? f.forecastDate ?? `day-${i}`;
          return (
            <div key={`${dk}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: c.textMuted, minWidth: 80 }}>{shortDate(dk)}</span>
              <span style={{ fontWeight: 600 }}>{Math.round(f.tempMin)}° / {Math.round(f.tempMax)}°</span>
              {f.frostRisk > 20 && <span style={{ fontSize: '0.7rem', color: frostColor(f.frostRisk), fontWeight: 700 }}>❄{f.frostRisk}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: `1px solid ${c.border}`, fontSize: '0.68rem', color: c.textMuted, textAlign: 'right' }}>
        tarimiklim.com
      </div>
    </div>
  );
}

function WidgetWrapper() {
  const params = useSearchParams();
  return <WidgetContent location={params.get('location') ?? 'auto'} />;
}

export default function HavaWidget() {
  return (
    <div style={{ display: 'inline-block', padding: '8px' }}>
      <Suspense fallback={<div style={{ padding: '1rem', fontSize: '0.85rem', color: '#5a6b7c' }}>Yükleniyor…</div>}>
        <WidgetWrapper />
      </Suspense>
    </div>
  );
}
