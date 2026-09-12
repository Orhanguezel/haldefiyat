import type { FastifyInstance } from "fastify";
import { GATE, getCityProductDetail, listCityProductPairs } from "./city-product";
import { getMarketComparison } from "./market-comparison";

export async function registerCityProduct(app: FastifyInstance) {
  /** GET /prices/city-products?eligible=1 — sitemap + ic link listesi (sehir, urun ciftleri). */
  app.get<{ Querystring: { eligible?: string; city?: string; product?: string } }>("/prices/city-products", async (req, reply) => {
    let items = await listCityProductPairs();
    if (req.query.eligible === "1") items = items.filter((p) => p.eligible);
    if (req.query.city) items = items.filter((p) => p.citySlug === req.query.city);
    if (req.query.product) items = items.filter((p) => p.productSlug === req.query.product);
    reply.header("Cache-Control", "public, max-age=600");
    return reply.send({ items, gate: GATE });
  });

  /** GET /prices/markets/:market/comparison — hal x Turkiye kiyasi (hal sayfasi blogu). */
  app.get<{ Params: { market: string } }>("/prices/markets/:market/comparison", async (req, reply) => {
    const item = await getMarketComparison(req.params.market.toLowerCase());
    reply.header("Cache-Control", "public, max-age=900");
    return reply.send({ item });
  });

  /** GET /prices/city-products/:city/:product — sayfa verisi. */
  app.get<{ Params: { city: string; product: string } }>("/prices/city-products/:city/:product", async (req, reply) => {
    const detail = await getCityProductDetail(req.params.city.toLowerCase(), req.params.product.toLowerCase());
    if (!detail) return reply.status(404).send({ error: "Bu sehir icin urun kaydi yok" });
    reply.header("Cache-Control", "public, max-age=600");
    return reply.send({ item: detail });
  });
}
