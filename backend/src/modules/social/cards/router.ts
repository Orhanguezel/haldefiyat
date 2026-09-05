import type { FastifyInstance } from "fastify";
import { buildCard, CARD_SERIES, type CardSeries } from "./index";
import type { CardSize } from "./render";

const SIZES: CardSize[] = ["tg", "ig", "wide"];

/**
 * Kart ucu — Tanitio (ekosistem-sosyal-medya) buradan ceker ve YAYINLAR.
 * Gorsel hal tarafinda yasar: onceki kurulumda medya Tanitio'ya kopyalaniyordu ve
 * dagitim sirasinda dosyalar tasinip 404 oluyordu.
 */
export async function registerSocialCards(app: FastifyInstance) {
  app.get<{ Querystring: { series?: string; size?: string } }>("/social/cards/today", async (req, reply) => {
    const series = (req.query.series ?? "k1").toLowerCase() as CardSeries;
    const size = (req.query.size ?? "ig").toLowerCase() as CardSize;
    if (!CARD_SERIES.includes(series)) return reply.status(400).send({ error: "Bilinmeyen seri" });
    if (!SIZES.includes(size)) return reply.status(400).send({ error: "Bilinmeyen boyut" });
    const card = await buildCard(series, size);
    if (!card) return reply.status(404).send({ error: "Bugün için yeterli veri yok" });
    reply.header("Cache-Control", "public, max-age=900");
    return reply.send({ item: card });
  });
}
