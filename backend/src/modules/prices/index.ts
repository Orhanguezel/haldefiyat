import type { FastifyInstance } from "fastify";
import { registerPrices as registerPricesCore } from "./router";
import { registerPricesForecast } from "./forecast-router";
import { registerCityProduct } from "./city-product-router";

export async function registerPrices(app: FastifyInstance) {
  await registerPricesCore(app);
  await registerPricesForecast(app);
  await registerCityProduct(app);
}
