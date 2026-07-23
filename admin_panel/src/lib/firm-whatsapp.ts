// Firma claim davetini WhatsApp click-to-chat (wa.me) linki olarak üretir.
// İNSAN-TETİKLİ: operatör butona basınca WhatsApp önceden-doldurulmuş mesajla açılır;
// toplu/otomatik gönderim DEĞİL. KVKK/İYS: mesajda gönderen kimliği + kaynak + ret (opt-out) var.

const SITE = "https://haldefiyat.com";

type FirmLite = {
  slug: string;
  name: string;
  phone: string | null;
  contactPerson: string | null;
  citySlug: string | null;
};

// TR telefonunu uluslararası (90XXXXXXXXXX) biçimine indirger. Geçersizse null.
export function normalizeTrPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0090")) d = d.slice(2);
  if (d.startsWith("90") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 11) return "90" + d.slice(1);
  if (d.length === 10 && /^[1-9]/.test(d)) return "90" + d;
  return null;
}

function firstName(contactPerson: string | null): string {
  const n = (contactPerson ?? "").trim().split(/\s+/)[0];
  return n ? ` ${n}` : "";
}

function titleCity(citySlug: string | null): string {
  if (!citySlug) return "Türkiye";
  return citySlug.charAt(0).toLocaleUpperCase("tr") + citySlug.slice(1);
}

export function buildFirmClaimMessage(firm: FirmLite): string {
  const city = titleCity(firm.citySlug);
  return (
    `Merhaba${firstName(firm.contactPerson)}, ben HalDeFiyat ekibinden.\n\n` +
    `Firmanız "${firm.name}", Türkiye hal fiyatları platformu haldefiyat.com'un ${city} firma rehberinde ücretsiz listeleniyor.\n\n` +
    `Profilinizi ücretsiz doğrulayıp öne çıkarabilir, telefon/WhatsApp bilgilerinizi görünür yapabilir ve günlük fiyatlarınızı girebilirsiniz:\n` +
    `${SITE}/firma/${firm.slug}\n\n` +
    `İlgilenmiyorsanız "ÇIKAR" yazmanız yeterli, kaydınızı listeden kaldıralım. İyi çalışmalar.`
  );
}

// wa.me linki (yeni sekmede açılır). Telefon geçersizse null.
export function buildFirmWhatsappLink(firm: FirmLite): string | null {
  const phone = normalizeTrPhone(firm.phone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildFirmClaimMessage(firm))}`;
}
