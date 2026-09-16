# Banner önizleme tutarlılığı — 15 Eylül 2026

Kök neden önbellek değildi: Hesap alanı GZL bileşenini `compactMobile` ile çağırırken BannerCreative ve admin iframe önizlemesi varsayılan büyük sürümü kullanıyordu. Kompakt mobil sürüm bileşenin ortak varsayılanı oldu; hesap, diğer banner slotları ve önizleme aynı mobil davranışı kullanır.

İkinci sorun: iframe yüksekliği documentElement.scrollHeight ile ölçülüyordu. Bu değer iframe viewport'undan küçük olamadığı için önizleme küçüldüğünde boşluk korunuyordu. Artık yalnız reklam sarmalayıcısı ölçülüyor. Panelin alt yükseklik sınırı 80 px; mobil çerçeve 390 px ve en fazla mevcut alan genişliğinde.

390 px doğrudan canlı önizleme ölçümü: GZL banner 90 px, dolguyla içerik 114 px.

Canlı frontend `.next-release-20260915ba01`, admin `.next-release-20260915bb01`; iki derleme ve servis yüklemesi başarılı. Kimlik doğrulanmış panelde Mobil sekmesi: banner 90 px, içerik 114 px, iframe 122 px (8 px pay). Böylece iframe'in eski yüksekliğiyle kendini büyütmesi sona erdi.
