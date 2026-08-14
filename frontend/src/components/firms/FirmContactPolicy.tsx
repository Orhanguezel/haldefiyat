import Link from "next/link";

export default function FirmContactPolicy() {
  return (
    <aside
      aria-labelledby="firm-contact-policy-title"
      className="mt-4 rounded-[8px] border border-(--color-border-soft) bg-(--color-bg-alt) p-4"
    >
      <h2 id="firm-contact-policy-title" className="font-(family-name:--font-display) text-sm font-bold text-(--color-foreground)">
        Firma iletişim bilgisi politikası
      </h2>
      <p className="mt-2 text-xs leading-5 text-(--color-muted)">
        Buradaki telefon, ilan sahibinin özel numarası değil; firma sahibi tarafından eklenen veya kamusal işletme kaynağından derlenen ticari iletişim hattıdır.
        Yayınlanması kimlik, yetki, hizmet kalitesi ya da anlık erişilebilirlik garantisi anlamına gelmez.
      </p>
      <p className="mt-2 text-xs leading-5 text-(--color-muted)">
        Yanlış, kişisel veya güncelliğini yitirmiş bir kayıt görürseniz {" "}
        <Link href="/iletisim?subject=Firma%20ileti%C5%9Fim%20bilgisi%20d%C3%BCzeltme" className="font-semibold text-(--color-brand) underline underline-offset-2">
          düzeltme bildirin
        </Link>.
      </p>
    </aside>
  );
}
