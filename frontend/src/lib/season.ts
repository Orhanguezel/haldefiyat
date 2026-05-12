export interface SeasonalProduct {
  slug: string;
  nameTr: string;
  emoji: string;
  months: number[]; // 1-12
  note: string;
}

const SEASONAL_PRODUCTS: SeasonalProduct[] = [
  { slug: "domates",        nameTr: "Domates",      emoji: "🍅", months: [6,7,8,9,10],    note: "Yaz hasadı en lezzetli dönemi" },
  { slug: "salatalik",      nameTr: "Salatalık",    emoji: "🥒", months: [5,6,7,8,9],     note: "Sezon başlangıcı, fiyatlar düşüyor" },
  { slug: "biber",          nameTr: "Biber",        emoji: "🌶️", months: [6,7,8,9,10],   note: "Yaz boyunca bol ve uygun" },
  { slug: "patlican",       nameTr: "Patlıcan",     emoji: "🍆", months: [6,7,8,9,10],    note: "Taze yaz mahsulü" },
  { slug: "kabak-dolmalik", nameTr: "Kabak",        emoji: "🥬", months: [6,7,8,9],       note: "Haziran'dan itibaren bol" },
  { slug: "cilek",          nameTr: "Çilek",        emoji: "🍓", months: [4,5,6],          note: "İlkbaharın en tatlı meyvesi" },
  { slug: "kiraz",          nameTr: "Kiraz",        emoji: "🍒", months: [5,6],            note: "Kısa sezon — taze hasat" },
  { slug: "seftali",        nameTr: "Şeftali",      emoji: "🍑", months: [6,7,8,9],       note: "Yaz meyvesi, haziran'dan itibaren" },
  { slug: "karpuz",         nameTr: "Karpuz",       emoji: "🍉", months: [6,7,8,9],       note: "Yaz aylarının vazgeçilmezi" },
  { slug: "kavun",          nameTr: "Kavun",        emoji: "🍈", months: [6,7,8,9],       note: "Yaz aylarında taze" },
  { slug: "uzum",           nameTr: "Üzüm",         emoji: "🍇", months: [8,9,10],         note: "Sonbahar hasadı" },
  { slug: "elma",           nameTr: "Elma",         emoji: "🍎", months: [9,10,11],        note: "Sonbahar hasadı en kaliteli dönem" },
  { slug: "armut",          nameTr: "Armut",        emoji: "🍐", months: [8,9,10,11],      note: "Yaz sonu — sonbahar hasadı" },
  { slug: "incir",          nameTr: "İncir",        emoji: "🫐", months: [8,9,10],         note: "Ege inciri — Ağustos'tan" },
  { slug: "portakal",       nameTr: "Portakal",     emoji: "🍊", months: [11,12,1,2,3],   note: "Kış meyvesi, Akdeniz'den taze" },
  { slug: "mandalina",      nameTr: "Mandalina",    emoji: "🍊", months: [11,12,1,2],      note: "Kış boyunca bol" },
  { slug: "limon",          nameTr: "Limon",        emoji: "🍋", months: [11,12,1,2,3,4], note: "Kış ve ilkbaharda en ucuz" },
  { slug: "kivi",           nameTr: "Kivi",         emoji: "🥝", months: [11,12,1,2],      note: "Kış meyvesi, Karadeniz'den" },
  { slug: "havuc",          nameTr: "Havuç",        emoji: "🥕", months: [10,11,12,1,2,3], note: "Kış sebzesi, fiyatlar düşük" },
  { slug: "ispanak",        nameTr: "Ispanak",      emoji: "🥬", months: [10,11,12,1,2,3], note: "Kış boyunca taze" },
  { slug: "brokoli",        nameTr: "Brokoli",      emoji: "🥦", months: [10,11,12,1,2,3], note: "Kış sebzesi, vitamin deposu" },
  { slug: "karnabahar",     nameTr: "Karnabahar",   emoji: "🥦", months: [10,11,12,1,2],   note: "Kış boyunca bol" },
  { slug: "sarimsak",       nameTr: "Sarımsak",     emoji: "🧄", months: [5,6,7],          note: "Taze hasat dönemi" },
  { slug: "sogan-kuru",     nameTr: "Soğan",        emoji: "🧅", months: [3,4,5,6],        note: "İlkbahar hasadı, en taze" },
  { slug: "marul",          nameTr: "Marul",        emoji: "🥬", months: [4,5,6,7,8,9,10], note: "İlkbahar-yaz boyunca" },
];

export function getProductsInSeason(month?: number): SeasonalProduct[] {
  const m = month ?? new Date().getMonth() + 1;
  return SEASONAL_PRODUCTS.filter((p) => p.months.includes(m));
}

export function getMonthName(month?: number): string {
  const m = month ?? new Date().getMonth() + 1;
  const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  return MONTHS[m - 1] ?? "";
}
