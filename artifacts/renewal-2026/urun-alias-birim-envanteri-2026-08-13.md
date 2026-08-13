# Ürün Alias ve Birim Envanteri — 13 Ağustos 2026

## Sonuç

Yazım çiftlerini yalnız redirect/canonical ile birleştirmek güvenli değil. Aynı kavramın
altındaki canlı kayıtlar farklı birimler taşıyor ve fiyat geçmişleri büyük. Canonical
sorgular çocuk fiyatlarını master altında topladığı için birim standardı kurulmadan
birleştirme `kg`, `adet`, `bağ` ve `demet` fiyatlarını aynı tabloda karıştırabilir.

## Canlı DB kanıtı

| Küme | Kayıt | Birim | Fiyat satırı | Tarih aralığı | Karar |
|---|---|---:|---:|---|---|
| Avokado | `avakado` | adet | 5.151 | 2004-03-11–2026-08-13 | Yazım hatalı ama adet serisi; doğrudan kg master’a bağlanmaz |
| Avokado | `avokado` | kg | 4.682 | 2023-02-06–2026-08-13 | Kg master adayı |
| Avokado | `avakado-muhtelif` | adet | 87 | 2026-04-24–2026-08-13 | Adet serisine bağlanmalı |
| Avokado | `avokado-adet` | DB’de kg | 72 | 2026-05-10–2026-08-13 | Slug/birim çelişkisi; kaynak satırları incelenmeli |
| Maydanoz | `maydanoz` | demet | 4.111 | 2023-02-06–2026-08-13 | Doğru yazım master adayı |
| Maydanoz | `maydonoz` | bağ | 3.298 | 2004-03-02–2026-08-13 | Yazım hatalı; bağ/demet eşdeğerliği kararı gerekli |
| Maydanoz | `maydanoz-bag` | kg | 145 | 2026-05-10–2026-08-13 | İsim/birim çelişkisi; otomatik merge dışı |

## Uygulama sırası

1. `kg/kilo/kilogram`, `adet/tane` ve `bağ/demet` için onaylı birim sözlüğü oluştur.
2. Her şüpheli slug için kaynak-hal ve son 20 ham kaydı incele.
3. Avokadoyu en az `avokado-kg` ve `avokado-adet` ölçüm aileleri olarak ayır.
4. Yanlış yazım URL’lerini aynı birimli doğru master’a 308 yönlendir.
5. Canonical atamadan önce ve sonra ürün+birim bazlı satır/fiyat aralığı invariant testi çalıştır.
6. ETL normalizer’daki `avakado → Avokado` düzeltmesini koru; mevcut tarihsel satırları taşımadan yeni yanlış slug üretimini durdur.

## Bu turda güvenle kapatılan hata

`DOMATES (...)` ham adındaki `(...)` gerçek varyant sanıldığı için temiz
`display_name=Domates` eziliyordu. Yeni ortak display-name guard’ı yalnız harf/rakam
içeren parantezi anlamlı qualifier kabul ediyor; `(...)` placeholder’ını her durumda
temizliyor. `ROKA (BAĞ)` gibi gerçek varyantlar korunuyor.
