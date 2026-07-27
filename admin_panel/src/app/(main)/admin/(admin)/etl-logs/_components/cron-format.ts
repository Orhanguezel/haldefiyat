const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function pad(n: string): string {
  return n.padStart(2, '0');
}

/** UTC saatini TRT'ye (UTC+3) cevir — cron env UTC calisir. */
function toTrt(hour: number, minute: number): string {
  const h = (hour + 3) % 24;
  return `${pad(String(h))}:${pad(String(minute))}`;
}

/**
 * 5 alanli cron ifadesini Turkce ozete cevirir (UTC->TRT donusumlu).
 * Panelde kullanilan pattern'leri kapsar; tanimadigini ham gosterir.
 */
export function cronToHuman(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, mon, dow] = parts;

  // Her N dakikada
  if (min.startsWith('*/') && hour === '*' && dom === '*' && dow === '*') {
    return `Her ${min.slice(2)} dakikada`;
  }
  // Belirli saatte, her gün
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && mon === '*' && dow === '*') {
    return `Her gün ${toTrt(Number(hour), Number(min))} (TRT)`;
  }
  // Haftanın belirli günü
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && /^\d+$/.test(dow)) {
    return `${DAYS[Number(dow) % 7]} ${toTrt(Number(hour), Number(min))} (TRT)`;
  }
  // Ayın belirli günü
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && mon === '*' && dow === '*') {
    return `Her ayın ${dom}. günü ${toTrt(Number(hour), Number(min))} (TRT)`;
  }
  // Her N saatte
  if (hour.startsWith('*/')) {
    return `Her ${hour.slice(2)} saatte`;
  }
  return expr;
}

export const CRON_CATEGORY_LABELS: Record<string, string> = {
  etl: 'ETL / Veri Çekme',
  seo: 'SEO / İndeksleme',
  icerik: 'İçerik / Yayın',
  sosyal: 'Sosyal Medya',
  bildirim: 'Bildirim / Uyarı',
  bakim: 'Bakım / Temizlik',
  reklam: 'Reklam / Sponsor',
};

export const CRON_CATEGORY_ORDER = ['etl', 'seo', 'icerik', 'bildirim', 'sosyal', 'reklam', 'bakim'];
