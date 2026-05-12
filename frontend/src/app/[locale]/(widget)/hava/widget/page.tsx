'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { WeatherWidget } from '@agro/ecosystem-weather-widget';

const TARIMIKLIM_API = 'https://tarimiklim.com/api/v1';

function WidgetContent() {
  const params = useSearchParams();
  const location = params.get('location') ?? 'auto';

  return (
    <WeatherWidget
      brand="haldefiyat"
      apiBase={TARIMIKLIM_API}
      location={location}
    />
  );
}

export default function HavaWidget() {
  return (
    <div style={{ display: 'inline-block', padding: '8px' }}>
      <Suspense>
        <WidgetContent />
      </Suspense>
    </div>
  );
}
