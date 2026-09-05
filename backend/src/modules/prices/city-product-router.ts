import type { FastifyInstance } from "fastify";
import { getCityProductDetail, listCityProductPairs } from "./city-product";

export async function registerCityProduct(app: FastifyInstance) {
  /** GET /prices/city-products?eligible=1 — sitemap + ic link listesi (sehir, urun ciftleri). */
  app.get<{ Querystring: { eligible?: string; city?: string; product?: string } }>("/prices/city-products", async (req, reply) => {
    let items = await listCityProductPairs();
    if (req.query.eligible === "1") items = items.filter((p) => p.eligible);
    if (req.query.city) items = items.filter((p) => p.citySlug === req.query.city);
    if (req.query.product) items = items.filter((p) => p.productSlug === req.query.product);
    reply.header("Cache-Control", "public, max-age=600");
    return reply.send({ items, gate: { minDays90: 45, minSearchVolume: 5000, maxStaleDays: 14 } });
  });

  /** GET /prices/city-products/:city/:product — sayfa verisi. */
  app.get<{ Params: { city: string; product: string } }>("/prices/city-products/:city/:product", async (req, reply) => {
    const detail = await getCityProductDetail(req.params.city.toLowerCase(), req.params.product.toLowerCase());
    if (!detail) return reply.status(404).send({ error: "Bu sehir icin urun kaydi yok" });
    reply.header("Cache-Control", "public, max-age=600");
    return reply.send({ item: detail });
  });
}
