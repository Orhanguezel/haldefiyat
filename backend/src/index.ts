import { createApp } from "./app";
import { env } from "@/core/env";
import { startCron } from "@/cron";
import type { FastifyInstance } from "fastify";

function checkSecurityDefaults() {
  const isProd = env.NODE_ENV === "production";
  if (isProd && env.JWT_SECRET === "change-me") {
    console.error("[GUVENLIK] JWT_SECRET varsayilan deger! Production icin degistirin.");
    process.exit(1);
  }
  if (isProd && env.COOKIE_SECRET === 'cookie-secret') {
    console.warn("[GUVENLIK] COOKIE_SECRET varsayilan deger — degistirmeniz onerilir.");
  }
}

async function main() {
  checkSecurityDefaults();
  const app: FastifyInstance = await createApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`Hal Fiyatlari API :${env.PORT} [${env.NODE_ENV}]`);

  startCron(app);
  installGracefulShutdown(app);
}

/**
 * pm2 reload/restart SIGINT gonderir ve varsayilan 1,6 sn sonra SIGKILL eder.
 * Kapanma kancasi olmadigi icin devam eden istekler ortasindan kesiliyordu:
 * nginx tarafinda "recv() failed / Connection reset", tarayici tarafinda ise
 * HTTP/2 multiplexing yuzunden TEK kopan baglanti o sayfanin ~10 alt kaynagini
 * birden 500 yapiyordu (1 Eylul 2026 olcumu: dagitim penceresi basina 2-11 adet,
 * hepsi tek bir sayfanin varlik listesi halinde).
 *
 * Sunucuyu kapatmak yeni baglantiyi durdurur, acik istekler biter. Sert cikis
 * zamanlayicisi backstop: close() takilirsa surec yine de kapanir.
 */
function installGracefulShutdown(app: FastifyInstance) {
  let closing = false;
  const shutdown = (signal: string) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, "[shutdown] kapaniyor, acik istekler bekleniyor");
    const hardExit = setTimeout(() => {
      app.log.warn("[shutdown] close() suresi asti, sert cikis");
      process.exit(0);
    }, 8_000);
    hardExit.unref();
    app.close().then(
      () => process.exit(0),
      (err) => {
        app.log.error({ err }, "[shutdown] close hatasi");
        process.exit(1);
      },
    );
  };
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => shutdown(signal));
  }
}

main().catch((e) => {
  console.error("Server failed", e);
  process.exit(1);
});
