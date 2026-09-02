import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { productPriceHistory } from "./repository";
import { aggregateByDay, buildForecast, validateForecastSeries } from "./forecast";

const qForecast = z.object({
  market: z.string().optional(),
  days:   z.coerce.number().int().min(1).max(30).optional(),
});

/** Reddetme gerekcesini kullaniciya anlasilir tek cumleye cevirir. */
function forecastRejectionMessage(reasons: readonly string[]): string {
  if (reasons.includes("insufficient_history")) return "Bu ürün için yeterli fiyat geçmişi yok (en az 21 gün gerekir).";
  if (reasons.includes("insufficient_backtest")) return "Geriye dönük doğrulama için yeterli gün yok.";
  if (reasons.includes("baseline_not_beaten")) return "Tahmin modeli bu üründe 'yarın bugünkü fiyat' varsayımından daha iyi sonuç vermiyor; yanıltıcı olmaması için yayınlanmıyor.";
  if (reasons.includes("mape_threshold")) return "Tahmin hata payı kabul edilen sınırın üzerinde.";
  if (reasons.includes("recent_drift")) return "Son günlerde tahmin hatası belirgin şekilde arttı.";
  return "Tahmin yayınlanabilir kalitede değil.";
}

export async function registerPricesForecast(app: FastifyInstance) {
  /**
   * GET /api/v1/prices/forecast/:productSlug?market=...&days=7
   * Son 30 gunluk fiyat geçmişine basit lineer regresyon uygular.
   * Market verilmezse tum halerin gunluk ortalamasi uzerinden tahmin yapar.
   * Guven seviyesi ornek buyuklugune gore: <5 low, <10 medium, >=10 high.
   */
  app.get<{ Params: { productSlug: string } }>(
    "/prices/forecast/:productSlug",
    async (req, reply) => {
      const parsed = qForecast.safeParse(req.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "invalid_query", message: "Geçersiz sorgu parametreleri." },
        });
      }
      const { market, days } = parsed.data;
      const horizon = days ?? 7;

      const history = await productPriceHistory(req.params.productSlug, market, 45);
      if (!history.length) {
        return reply.status(404).send({
          error: {
            code: "no_price_history",
            message: "Bu ürün için fiyat geçmişi bulunamadı. Ürün kodunu /api/v1/prices/products listesinden doğrulayın.",
          },
          details: { productSlug: req.params.productSlug },
        });
      }

      const series = aggregateByDay(history);
      if (!series.length) {
        return reply.status(404).send({
          error: { code: "no_valid_points", message: "Geçerli fiyat noktası hesaplanamadı." },
          details: { productSlug: req.params.productSlug },
        });
      }

      const validation = validateForecastSeries(series);
      if (!validation.publishable) {
        // 422 = tahmin HESAPLANABILIYOR ama guvenilir degil. En sik sebep
        // "baseline_not_beaten": model, "yarin = bugun" demekten daha kotu.
        // Ornek (2026-09-02): domates model MAPE %4,55 / naif taban %2,90 -> reddedilir;
        // patates %1,85 / %3,42 -> yayinlanir. Kotu tahmini yayinlamak, hic tahmin
        // vermemekten zararlidir; bu yuzden kapi bilerek kapali.
        //
        // Gerekce `details` altinda doner: global hata normalizer'i yalnizca
        // `error.code/message` ve `details` alanlarini korur, diger ust duzey
        // alanlari atar (once validation/policy bu yuzden kayboluyordu).
        return reply.status(422).send({
          error: {
            code: "forecast_not_publishable",
            message: forecastRejectionMessage(validation.reasons),
          },
          details: {
          productSlug: req.params.productSlug,
          marketSlug: market ?? null,
          validation,
          policy: {
            minimumHistoryPoints: 21,
            minimumBacktestPoints: 7,
            maximumMapePct: 25,
            mustBeatNaiveBaseline: true,
            maximumRecentDriftRatio: 1.5,
          },
          },
        });
      }

      const lastDate = series[series.length - 1]!.date;
      const result = buildForecast(series, lastDate, horizon);

      return reply.send({
        productSlug: req.params.productSlug,
        marketSlug:  market ?? null,
        lastDate,
        sampleSize:  result.sampleSize,
        confidence:  result.confidence,
        slope:       result.slope,
        intercept:   result.intercept,
        predictions: result.predictions,
        validation,
        disclaimer:  "Tahminler bilgilendirme amaçlıdır; tek başına ticari karar için kullanılmamalıdır.",
      });
    },
  );
}
