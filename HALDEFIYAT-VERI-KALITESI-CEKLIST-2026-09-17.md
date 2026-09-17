# Veri Kalitesi Temizliği — Durum ve Checklist

**Tarih:** 17 Eylül 2026 · **Durum:** devam ediyor · **Sonraki adım:** §3.3

Bu dosya, fiyat verisindeki bozuklukların temizliğini takip eder. Bir oturumda çok iş
yapıldığı için neyin bitip neyin kaldığı buradan okunur.

---

## 1. Tek komutla durum

```bash
ssh vps-vistainsaat 'cd /var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari \
  && bash backend/scripts/kanonik-denetim.sh'
```

Beş bölüm basar. **Her bölüm bir kuyruktur, hüküm değildir** — çıkan her satır elle
karara bağlanır. Güncel durum (17 Eyl):

| # | Bölüm | Ne arar | Kuyruk |
|---|---|---|---|
| 1 | Kanonik bağ sapması | iki kayıt aynı ürün mü? | 43 |
| 2 | Yutulmayı bekleyen dublike | aynı ürünün iki kaydı | 30 |
| 3 | Yönlendirmesiz ölü slug | yutulmuş ama 404 veriyor | **0 ✅** |
| 4 | Görünmeyen satırlar | birim uyuşmuyor, hiçbir yerde görünmüyor | 20 (toplam 147.066 satır) |
| 5 | Şüpheli seri | bozuk fiyat serisi | 19 |

---

## 2. Bugün yapılanlar (özet)

**Veri:** 26 dublike yutuldu · 19 yanlış kanonik bağ kaldırıldı · **3.414 satır karantinaya**
(3.312 kaynak-ürün gürültüsü + 102 tek aykırı) · 2 ürün pasifleştirildi · 13 satır doğru
ürüne taşındı. Aktif ürün 1.240 → 1.212. **Hiçbir satır silinmedi** — hepsi
`hf_price_quarantine`'de, geri alınabilir.

**Manşet rakamlarda düzelen ürünler (örnekler):**

| ürün | önce | sonra |
|---|---|---|
| hamsi | 202,96 | **90,26** |
| kekik | 59,32 | **30,59** |
| brokoli | 25 – **897** | 25 – 163 |
| ıspanak | 21 – **611** | 19 – 175 |
| turp kırmızı | 9 – **447** | 9 – 63 |
| nar | 125,17 | **106,53** |
| dut | 103,24 | **92,08** |

**Yeni araçlar** (hepsi `/api/v1/admin/...`):

| uç | ne yapar | koruması |
|---|---|---|
| `POST /hal/prices/:id/karantinaya-al` | tek satırı karantinaya alır | — |
| `POST /hal/prices/kaynak-karantina` | bir ürün+kaynak çiftinin tüm satırları | ürünü tümden boşaltacaksa **reddeder** |
| `POST /hal/prices/birim-tasima` | birim uyuşmayan satırları doğru ürüne taşır | hedef birimi tutmuyorsa reddeder |
| `POST /hal/products/unmerge` | yanlış kanonik bağı kaldırır | `family_slug` korunur |
| `POST /hal/products/absorb` | dublike kaydı yutar | torba kaydı reddeder, 301 yazar |

**Düzeltilen sessiz kusurlar:** absorb sonrası slug'lar 404 veriyordu (artık 301) ·
`productPriceHistory` pasif ürünü filtrelemiyordu · denetim public süzgeçleri
uygulamıyordu (muz için yanlış alarm veriyordu) · torba kayıtlar manşet ortalamaya
giriyordu (dut +%38,8).

---

## 3. KALAN İŞLER

### 3.1 — Şüpheli seri kuyruğu (§5), 19 çift · **sıradaki iş**

İki kural, ikisi de ölçülerek kondu (bkz. §4):
- **A** medyandan 5 kat uzak satır oranı ≥ %5 — kümelenmiş gürültü
- **B** medyandan 10 kat uzak ≥ 1 satır — tek günlük sıçrama

- [x] **İndexli 2 çift** — ikisi de **dokunulmadı, kapatıldı**. `defne-yapragi` 27 satır
      3,00→90,00 arasında *sürekli* dağılıyor (31,00 sekiz kez tekrar), bozuk seri imzası
      yok; ucuz bir yeşillik için geniş ama tek kümeli. `kaya-korugu` aynı gerekçe
- [x] Üç torba kaydı **doğrulandı** — `domates-diger`, `fasulye-taze-diger`,
      `uzum-beyaz-diger` residual kuralıyla manşetten çıkıyor, işlem gerekmiyor
- [ ] **İndexsiz 14 çift** — çoğu %5–9 bandında, düşük öncelikli

### 3.2 — Kanonik bağ sapması (§1), 43 çift

Fiyatı hedefinden belirgin ayrışan bağlar. Çoğu **meşru kalite/sınıf varyantı**
(`domates-2-sinif`, `elma-sanayi`, `portakal-sanayi`) — onlara dokunulmaz.

- [ ] Listeyi üç sınıfa ayır: gerçekten ayrı ürün → `unmerge` · aynı ürün → `absorb` ·
      kalite varyantı → dokunma
- [ ] Şüpheliler: `karadut` → `dut-kara`, `musmula` → `dongel-musmula` (ikisi de aynı
      ürün gibi, absorb adayı) · `marul-k` / `marul-g` (hedefleri yanlış olabilir)
- [ ] `bogrulce`/`borulce` 2,7 kat ve `polorosso`/`marul-lolorosso` 3 kat — bağ mı yanlış,
      veri mi bozuk, ayrıştırılsın

### 3.3 — Yutulmayı bekleyen dublike (§2), 30 çift

Kanonik bağlı ama hâlâ kendi satırlarını tutan kayıtlar. **Çakışma = 0 olanlar güvenle
yutulabilir** (absorb numerik olarak nötrdür: satırlar zaten hedefin ortalamasına giriyor).

- [x] Yazım/eşanlam varyantlarını yut — **34 tanesi yapıldı**, hiçbirinde satır düşmedi,
      her birine 301 yazıldı. Son parti: `armut-santamira`→`santamaria`,
      `papates-yeni`→`patates-taze`, `k-bahar`→`karnabahar`,
      `kokty-domates-ceri`→`domates-kokteyl`, `dongel`, `salatalik-tursu`,
      `kirmizi-marul`→`marul-lolorosso`, `fasulye-taze-cali`→`fasulye-cali`
- [ ] `turp-siyah-kg` → `turp-siyah` **bırakıldı**: 15,67 vs 44,04 (2,8 kat) — yazım
      varyantı gibi görünüyor ama fiyatlar tutmuyor, ayrıca incelensin
- [ ] `kabak-bal`, `kabak-taze`, `kabak-beyaz` **yutulmasın** — ayrı çeşitler
- [ ] Torba kayıtlar (`*-muhtelif`, `*-diger`) **yutulmasın** — uç zaten reddediyor

### 3.4 — Görünmeyen satırlar (§4), 147.066 satır · **en büyük açık**

Satır birimi ürün birimiyle uyuşmadığı için hiçbir yerde gösterilmiyor. Kural doğru
(koli fiyatının kiloya karışmasını önler), sorun satırın **yanlış üründe** olması.

- [ ] **Hedefi olan** vakalar → `birim-tasima` ucu (muz'da 13 satır böyle kurtarıldı)
- [ ] **Hedefi olmayan** vakalar (`roka` demet / satır kg, 606 satır) → yeni kayıt mı
      açılmalı yoksa ürünün birimi mi yanlış, **karar gerekir**
- [ ] Otomatik uygulanamaz: aile içi eşleştirme bazı kayıtlarda birden fazla aday veriyor
      (`sogan-yesil` → 3, `ithal-kalamar` → 4) ve bir kısmı açıkça yanlış

### 3.5 — ETL karantina kuyruğu, 783 kayıt · **bu oturumda hiç dokunulmadı**

`hf_price_quarantine`'de `status='pending'` duran, ETL'in kendi kurallarıyla yakaladığı
kayıtlar. Bunlar history'ye hiç girmemiş.

- [ ] Kuyruk tasnif edilsin (donuk seri / gürültü seri / gerçek fiyat hareketi)
- [ ] Tek tek değil sınıf sınıf karara bağlansın

### 3.6 — Kaynak seviyesi (kod işi)

- [ ] `izmir_balik` kaynağı birçok balıkta 10–1500 bandında veri veriyor; tek kaynak
      olduğu için karantina uygulanamıyor (`iskorpit` indexli). Kaynak parser'ı incelensin
- [ ] `hal_gov_tr_ulusal` nadir ürünlerde anlamsız ortalama üretiyor — ürün+kaynak
      kara listesi mi, minimum işlem hacmi eşiği mi, karar verilsin

---

## 4. Eşik neden bu? (ölçüm kaydı)

Karantinadaki 21 bilinen bozuk çift + canlıdaki 1.952 çift aynı ölçütlerle tarandı:

| kural | bozuk yakalama | kuyruk |
|---|---|---|
| 5 kat + %5 | 19/21 | 13 |
| 5 kat + %3 | 20/21 | 38 |
| 3 kat + %3 | 21/21 | 160 — elle incelenemez |
| **10 kat, ≥1 satır (B)** | **21/21** | **28** |
| **A + B birleşik** | **21/21** | **33** |

Eşiği %3'e indirmek 25 yeni inceleme karşılığında 1 gerçek bulgu getiriyordu; ikinci kural
daha iyi sonucu daha kısa kuyrukla verdi.

**Elenen ölçütler:** `p90/p10` (bozuklar 2,4–87'ye yayılıyor), `max/min` (5 yıllık seride
enflasyon: ıspanak 3.053 kat ama sağlam), `max/medyan` (1,4–68).

**Kanıtlanmış yanlış pozitifler** — bunlara dokunulmaz: mevsimlik ürün
(`mandalina/trabzon` 23–210) · gerçekten pahalı ürün (`kaya-korugu` 23–372) · sezon boyu
düzenli artan seri (`kuskonmaz/ulusal` Haziran 100 → Eylül 900, tek tepeli).

---

## 5. Çalışma kuralları

1. **Hiçbir satır silinmez.** Karantina = `hf_price_quarantine`'e `rejected` + karar kaydı
   (`before` json). Geri alınabilir.
2. **Uç değer ≠ yüksek değer.** `ithal-kalamar-koli`de bozuk olan **düşük** değerlerdi
   (25 TL/koli, gerçek 2.500 — kuruş/100 hatası). Körlemesine yüksekleri elemek gerçek
   veriyi siler.
3. **Ölçüt kısa pencerede anlamlı.** Tüm zamanlarda tarayınca enflasyon her seriyi bozuk
   gösterir.
4. **Ölçmeden eşik koyma.** Bu dosyadaki her eşiğin arkasında §4'teki tablo var.
5. Her işlemden sonra ürünün kalan serisi ve canlı sayfası doğrulanır.
