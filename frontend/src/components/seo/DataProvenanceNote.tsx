import Link from "next/link";

type Props = {
  /** "Adana Büyükşehir Belediyesi Toptancı Hali" gibi, kaydin geldigi kaynak. */
  sourceLabel: string;
  /** Bu sayfadaki satir/gun sayisi — birimli, gercek. */
  recordCount: number;
  recordUnit: "kayıt günü" | "hal kaydı" | "ürün kaydı";
  /** "16 Eylül 2026" — yoksa tarih cumlesi kurulmaz. */
  latestDateTr?: string;
  /** Ekosistem geneli: kac halden, hangi yildan beri. Sayi yoksa cumle atlanir. */
  activeMarkets?: number;
  sinceYear?: string;
};

/**
 * "Bu veri kimin, nasil olculdu, yanlissa ne olur" blogu — tek yerden.
 *
 * Tanitio katalogu (17 Eyl 2026) her sayfada "birinci-el veri", "deneyim
 * anlatimi" ve "guvence" sinyallerini eksik saydi; oysa sitenin tamami kendi
 * ETL'iyle derlenen birinci-el olcum. Sinyal metinde ACIKCA yazilmadikca ne
 * analizor ne okuyucu goruyor. Sayilar props'tan gelir; sabit iddia yok.
 *
 * Guvence paragrafi (18 Eyl 2026): bir sey satmadigimiz icin iade/garanti
 * kavrami gecersiz — bizim karsiligimiz VERI guvencesi. Metin /duzeltme-politikasi
 * ile birebir tutarli tutulur; orada verilmeyen bir soz (ornegin "ayni gun
 * cozulur") burada da verilmez.
 */
export default function DataProvenanceNote({ sourceLabel, recordCount, recordUnit, latestDateTr, activeMarkets, sinceYear }: Props) {
  return (
    <aside className="mt-6 rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4 text-sm leading-6 text-(--color-muted)" aria-label="Veri kaynağı, yöntem ve düzeltme">
      <p>
        <strong className="text-(--color-foreground)">Bu sayfadaki veri HaldeFiyat&apos;ın kendi ölçümüdür.</strong>{" "}
        Kaynak: {sourceLabel}. Bu sayfada {recordCount.toLocaleString("tr-TR")} {recordUnit}
        {latestDateTr ? `, son kayıt ${latestDateTr}` : ""}; her satır kaynak, tarih, çeşit ve birim etiketiyle
        saklanır, elle fiyat girilmez.
        {activeMarkets && sinceYear
          ? ` Aynı yöntem ${activeMarkets} halde ${sinceYear}'ten bu yana uygulanıyor; yerel kayıt ile Türkiye hal fiyatları tablosu hiçbir zaman birbirinin yerine kullanılmaz.`
          : ""}
      </p>
      <p className="mt-2 text-xs leading-6">
        Hatalı gördüğünüz bir kaydı bildirin: birincil kaynak ve ETL çalışma kaydıyla karşılaştırılır,
        doğrulanamayan satır yayından çıkarılır. Çıkarılan satır silinmez, geri alınabilir biçimde saklanır.
        Her bildirimin aynı gün sonuçlanacağı taahhüt edilmez; öncelik sırası{" "}
        <Link href="/duzeltme-politikasi" className="font-semibold text-(--color-brand) underline underline-offset-2">düzeltme politikasında</Link>{" "}
        yazılıdır.
      </p>
      <p className="mt-2 text-xs leading-6">
        <Link href="/metodoloji" className="font-semibold text-(--color-brand) underline underline-offset-2">Metodoloji</Link>
        {" · "}
        <Link href="/veri-kaynagi-politikasi" className="font-semibold text-(--color-brand) underline underline-offset-2">Veri kaynağı politikası</Link>
        {" · "}
        <Link href="/gizlilik-politikasi" className="font-semibold text-(--color-brand) underline underline-offset-2">Gizlilik ve KVKK</Link>
        {" · "}veri CC BY 4.0 ile serbestçe alıntılanabilir.
      </p>
    </aside>
  );
}
