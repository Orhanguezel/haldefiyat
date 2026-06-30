#!/usr/bin/env python3
"""awk ciktisini (result bolumleri) markdown trafik raporu iskeletine cevirir.

Kullanim: traffic-report-format.py <result.txt> <from> <to> <mon_abbr> <year> <month_tr>
Veri tablolari otomatik doldurulur; trend ve narrative bolumleri <!-- TODO --> birakilir.
"""
import sys
from datetime import date

WD_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
MON_NUM = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
           "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12}
STATUS_DESC = {
    "200": "Başarılı", "301": "Kalıcı yönlendirme", "302": "Geçici yönlendirme",
    "304": "Cache", "204": "İçerik yok (track beacon)", "206": "Kısmi içerik",
    "404": "Bulunamadı", "410": "Gone (ölü ürün redirect)", "499": "İstemci kapattı",
    "308": "Kalıcı (POST)", "307": "Geçici (POST)", "400": "Hatalı istek",
    "401": "Yetkisiz", "403": "Yasak", "500": "Sunucu hatası (admin analytics)",
    "502": "Backend kapalı (geçici)", "503": "Servis yok", "201": "Oluşturuldu",
}
BOT_LABEL = {"petalbot": "petalbot", "yandex": "yandex", "googlebot": "googlebot",
             "applebot": "applebot", "bingbot": "bingbot", "ahrefsbot": "ahrefsbot"}


def parse(path):
    sec, out = None, {}
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith("## "):
            sec = line[3:]; out[sec] = []
        elif sec and line:
            out[sec].append(line)
    return out


def kv(line):
    return dict(p.split("=", 1) for p in line.split("|") if "=" in p)


def main():
    res, frm, to, mon, year, month_tr = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], int(sys.argv[5]), sys.argv[6]
    s = parse(res)
    f = lambda n: f"{int(n):,}"

    days, t_human, t_bot, t_total, t_pv, t_mob = [], 0, 0, 0, 0, 0
    for ln in s.get("DAILY", []):
        if ln.startswith("TOTAL"):
            tt = kv(ln); t_mob = int(tt["mob"]); continue
        d = kv(ln); dd = int(ln.split("|", 1)[0])
        wd = WD_TR[date(year, MON_NUM[mon], dd).weekday()]
        days.append((dd, wd, int(d["human"]), int(d["bot"]), int(d["total"]), int(d["uniqIP"]), d["mob%"], int(d["pv"])))
        t_human += int(d["human"]); t_bot += int(d["bot"]); t_total += int(d["total"]); t_pv += int(d["pv"])
    ndays = len(days)
    avg_human = round(t_human / ndays) if ndays else 0
    avg_pv = round(t_pv / ndays) if ndays else 0
    mob_pct = round(t_mob * 100 / t_human) if t_human else 0
    human_pct = round(t_human * 100 / t_total, 1) if t_total else 0
    bot_pct = round(t_bot * 100 / t_total, 1) if t_total else 0

    gcl = kv(s.get("GCLID", ["gclid_total=0|uniqIP=0"])[0])
    P = []
    w = P.append
    w(f"# HalDeFiyat Trafik Analizi — {frm}–{to} {month_tr} {year} ({ndays} tam gün)\n")
    w(f"> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu). Üretim: traffic-report.sh.")
    w(f"> **Devam raporu:** <!-- önceki rapor adı --> raporunun devamı.\n")
    w("## Özet Tablo\n")
    w("| Metrik | Değer |")
    w("|---|---|")
    w(f"| Toplam istek | **{f(t_total)}** |")
    w(f"| İnsan trafik (istek*) | **{f(t_human)}** (%{human_pct}) |")
    w(f"| Bot/Crawler trafik | **{f(t_bot)}** (%{bot_pct}) |")
    w(f"| Günlük ort. insan trafik ({ndays} tam gün) | **{f(avg_human)}/gün** |")
    w(f"| Mobil / Masaüstü (insan) | **%{mob_pct} / %{100 - mob_pct}** |")
    w(f"| Google Ads tıklama (gclid, request) | **{f(gcl['gclid_total'])} istek** |")
    w(f"| → benzersiz IP (reklam tıklayan) | **{f(gcl['uniqIP'])}** |")
    w(f"| ★ Gerçek JS pageview | **{f(t_pv)}** (~**{f(avg_pv)}/gün**) |\n")
    w(f"\\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **{f(avg_pv)} pageview/gün** (track beacon).\n")

    w("## Öncesi / Sonrası — trend\n")
    w("| Metrik | <!-- önceki --> | **bu dönem** | Trend |")
    w("|---|---|---|---|")
    w(f"| Günlük insan istek | — | **{f(avg_human)}** | <!-- --> |")
    w(f"| Gerçek JS pageview/gün | — | **~{f(avg_pv)}** | <!-- --> |")
    w(f"| Mobil oran | — | **%{mob_pct}** | <!-- --> |\n")

    w("## Günlük Trafik\n")
    w("| Tarih | Gün | İnsan | Bot | Toplam | Uniq IP | Mobil% |")
    w("|---|---|---|---|---|---|---|")
    for dd, wd, hu, bo, to_, uc, mp, pv in days:
        w(f"| {dd} {month_tr[:3]} | {wd} | {f(hu)} | {f(bo)} | {f(to_)} | {f(uc)} | %{mp} |")
    w(f"| **TOPLAM** | | **{f(t_human)}** | **{f(t_bot)}** | **{f(t_total)}** | — | **%{mob_pct}** |\n")
    hi = max(days, key=lambda x: x[2]); lo = min(days, key=lambda x: x[2])
    w(f"- En yüksek gün: **{hi[0]} {month_tr[:3]} ({f(hi[2])} insan)**; en düşük: {lo[0]} {month_tr[:3]} ({f(lo[2])}). <!-- yorum -->\n")

    hours = {h: int(c) for h, c in (kv2(x) for x in s.get("HOURLY", []))}
    if hours:
        peak = max(hours, key=hours.get)
        w("## Saatlik Dağılım (insan, UTC — TR = +3)\n")
        w(f"- Tepe: **{peak}:00 UTC ({(int(peak)+3)%24:02d}:00 TR) = {f(hours[peak])}**. <!-- ritim yorumu -->\n")

    w("## HTTP Sağlık (durum kodları, dönem)\n")
    w("| Kod | İstek | Açıklama |")
    w("|---|---|---|")
    codes = sorted(((c, int(n)) for c, n in (kv2(x) for x in s.get("STATUS", []))), key=lambda x: -x[1])
    x5 = 0
    for c, n in codes:
        if c.startswith("5"):
            x5 += n
        w(f"| {c} | {f(n)} | {STATUS_DESC.get(c, '')} |")
    w(f"\n**5xx toplam: {f(x5)}** / {f(t_total)} = **%{round(x5*100/t_total,2) if t_total else 0}**. <!-- kaynak yorumu -->\n")

    bots = {b: int(n) for b, n in (kv2(x) for x in s.get("BOTNAMES", []))}
    ais = {a: int(n) for a, n in (kv2(x) for x in s.get("AI", []))}
    w("## Bot / AI Crawler Dağılımı (UA, dönem)\n")
    blist = " · ".join(f"{BOT_LABEL.get(b,b)} {f(n)}" for b, n in sorted(bots.items(), key=lambda x: -x[1]))
    alist = " · ".join(f"{a} {f(n)}" for a, n in sorted(ais.items(), key=lambda x: -x[1]))
    w(f"- {blist}")
    w(f"- **AI motor crawler:** {alist} → toplam **~{f(sum(ais.values()))} hit** <!-- yorum -->\n")

    land = sorted(((p, int(n)) for p, n in (kv2(x) for x in s.get("GCLID_LAND", []))), key=lambda x: -x[1])[:16]
    w("## Google Ads (gclid) Landing\n")
    w("- " + " · ".join(f"`{p}` {f(n)}" for p, n in land) + " <!-- yorum -->\n")

    refs = sorted(((r, int(n)) for r, n in (kv2(x) for x in s.get("REFERRER", []))), key=lambda x: -x[1])[:15]
    w("## Dış Referrer (insan)\n")
    w("- " + " · ".join(f"{r} {f(n)}" for r, n in refs) + " <!-- yorum -->\n")

    w("---\n\n## ⚠️ HATALAR / BULGULAR\n\n<!-- TODO: bulgular -->\n")
    w("## Aksiyon Listesi (öncelik sırası)\n\n<!-- TODO: aksiyonlar -->\n")
    w("## Genel Durum: <!-- TODO -->\n")
    print("\n".join(P))


def kv2(line):
    k, v = line.rsplit("=", 1)
    return k, v


if __name__ == "__main__":
    main()
