/**
 * One-shot: son N haftanın endeks snapshotunu hesapla ve DB'ye yaz.
 * Kullanım: bun scripts/calculate-index-now.ts [weeks=12]
 */
import "dotenv/config";
import { calculateWeeklyIndex } from "../src/modules/index/calculator";

const WEEKS = parseInt(process.argv[2] ?? "12", 10);

function isoWeekLabel(offsetWeeks: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetWeeks * 7);
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(
    ((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
  );
  return `${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

async function main() {
  console.log(`[index] Son ${WEEKS} hafta hesaplanıyor...\n`);
  let ok = 0;
  let skipped = 0;

  // En eskiden en yeniye
  for (let i = WEEKS; i >= 0; i--) {
    const weekLabel = isoWeekLabel(i);
    try {
      const result = await calculateWeeklyIndex(weekLabel);
      if (result) {
        const arrow = result.indexValue > 100 ? "▲" : result.indexValue < 100 ? "▼" : "—";
        console.log(`  ✅ ${result.indexWeek}  ${arrow} ${result.indexValue.toFixed(2).padStart(7)}  sepet: ${result.basketAvg.toFixed(2)} ₺/kg  (${result.productsCount} ürün)`);
        ok++;
      } else {
        console.log(`  ⚠️  ${weekLabel}  — veri yok, atlandı`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ❌ ${weekLabel} hata:`, err);
      skipped++;
    }
  }

  console.log(`\n[index] Tamamlandı: ${ok} hafta kaydedildi, ${skipped} hafta atlandı.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[index] Fatal:", err);
  process.exit(1);
});
