"use client";

import { Combobox } from "@/components/ui/Combobox";
import { districtsOfProvinceSlug, provinceBySlug, TURKEY_CITY_OPTIONS } from "@/data/turkey-cities";

type Props = {
  citySlug?: string | null;
  districtSlug?: string | null;
  required?: boolean;
  onChange: (value: { citySlug: string | null; districtSlug: string | null }) => void;
};

export function CityDistrictSelect({ citySlug, districtSlug, required = false, onChange }: Props) {
  const districtOptions = districtsOfProvinceSlug(citySlug);
  const cityKnown = !citySlug || Boolean(provinceBySlug(citySlug));
  const districtKnown = !districtSlug || districtOptions.some((item) => item.value === districtSlug);

  return (
    <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-muted)">
          İl{required ? " *" : ""}
        </span>
        <Combobox
          options={TURKEY_CITY_OPTIONS}
          value={citySlug ?? null}
          onChange={(nextCity) => onChange({ citySlug: nextCity, districtSlug: null })}
          placeholder="İl seçin"
          emptyText="İl bulunamadı"
        />
        {!cityKnown && <p className="text-xs text-(--color-warning)">Kayıtlı il listede yok. Lütfen yeniden seçin.</p>}
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-muted)">
          İlçe
        </span>
        <Combobox
          options={districtOptions}
          value={districtSlug ?? null}
          onChange={(nextDistrict) => onChange({ citySlug: citySlug ?? null, districtSlug: nextDistrict })}
          placeholder={citySlug ? "İlçe seçin" : "Önce il seçin"}
          disabled={!citySlug}
          emptyText="İlçe bulunamadı"
        />
        {!districtKnown && <p className="text-xs text-(--color-warning)">Kayıtlı ilçe bu ile ait değil. Lütfen yeniden seçin.</p>}
      </label>
    </div>
  );
}
