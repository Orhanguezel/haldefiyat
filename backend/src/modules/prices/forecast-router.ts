import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { productPriceHistory } from "./repository";
import { aggregateByDay, buildForecast } from "./forecast";

const qForecast = z.object({
  market: z.string().optional(),
  days:   z.coerce.number().int().min(1).max(30).optional(),
});

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
        return reply.status(400).send({ error: "Gecersiz sorgu parametreleri" });
      }
      const { market, days } = parsed.data;
      const horizon = days ?? 7;

      const history = await productPriceHistory(req.params.productSlug, market, 30);
      if (!history.length) {
        return reply.status(404).send({
          error: "Bu urun icin yeterli fiyat verisi bulunamadi",
          productSlug: req.params.productSlug,
        });
      }

      const series = aggregateByDay(history);
      if (!series.length) {
        return reply.status(404).send({
          error: "Gecerli fiyat noktasi hesaplanamadi",
          productSlug: req.params.productSlug,
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
      });
    },
  );
}
