"use client";

import { useCallback, useRef, useState } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  useJsApiLoader,
} from "@react-google-maps/api";
import Link from "next/link";
import type { Market } from "@/lib/api";
import { getCityCoords } from "@/lib/city-coords";

interface CityGroup {
  cityName: string;
  lat: number;
  lng: number;
  markets: Market[];
}

interface Props {
  markets: Market[];
}

const MAP_CENTER = { lat: 39.1, lng: 35.5 };
const MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 6,
  minZoom: 5,
  maxZoom: 12,
  mapTypeId: "roadmap",
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: true,
  gestureHandling: "cooperative",
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8a9bb8" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2e" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2d3a52" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4a6080" }] },
    { featureType: "road", stylers: [{ visibility: "simplified" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#253046" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2d3a52" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1526" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#2a3a5a" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1e2535" }] },
  ],
};

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

function groupByCity(markets: Market[]): CityGroup[] {
  const map = new Map<string, CityGroup>();
  for (const m of markets) {
    if (!m.cityName || m.regionSlug === "ulusal") continue;
    const coords = getCityCoords(m.cityName);
    if (!coords) continue;
    if (!map.has(m.cityName)) {
      map.set(m.cityName, { cityName: m.cityName, ...coords, markets: [] });
    }
    map.get(m.cityName)!.markets.push(m);
  }
  return [...map.values()];
}

export default function TurkeyMapClient({ markets }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "haldefiyat-map",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeCity, setActiveCity] = useState<CityGroup | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const cityGroups = groupByCity(markets);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-(--color-muted)">
        <p>Harita yüklenemedi. Lütfen API key'i kontrol edin.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-surface)">
        <div className="flex items-center gap-3 text-(--color-muted)">
          <span className="live-dot-sm" />
          <span className="text-[13px]">Harita yükleniyor…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-(--color-border)">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={MAP_CENTER}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={() => setActiveCity(null)}
      >
        {cityGroups.map((city) => (
          <MarkerF
            key={city.cityName}
            position={{ lat: city.lat, lng: city.lng }}
            onClick={() => setActiveCity(city)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: city.markets.length > 1 ? 10 : 8,
              fillColor: activeCity?.cityName === city.cityName ? "#facc15" : "#4ade80",
              fillOpacity: 0.9,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
          />
        ))}

        {activeCity && (
          <InfoWindowF
            position={{ lat: activeCity.lat, lng: activeCity.lng }}
            onCloseClick={() => setActiveCity(null)}
            options={{ pixelOffset: new google.maps.Size(0, -16) }}
          >
            <div className="min-w-[180px] max-w-[240px] rounded-xl bg-[#1a1f2e] p-3 text-white">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-green-400">
                {activeCity.cityName}
              </p>
              <ul className="space-y-1.5">
                {activeCity.markets.map((m) => (
                  <li key={m.id}>
                    <a
                      href={`/hal/${m.slug}`}
                      className="block rounded-lg bg-white/5 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
                    >
                      {m.name}
                      <span className="ml-1 text-[10px] text-green-400">→</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-center text-[10px] text-white/40">
                {activeCity.markets.length} hal · fiyatları görmek için tıklayın
              </p>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface)/90 px-3 py-2 backdrop-blur-sm">
        <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
        <span className="text-[11px] font-medium text-(--color-muted)">
          {cityGroups.length} şehir · {markets.filter((m) => m.regionSlug !== "ulusal").length} hal
        </span>
      </div>
    </div>
  );
}
