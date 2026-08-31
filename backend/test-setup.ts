/**
 * Test kosumu icin atilabilir env degerleri.
 *
 * `src/core/env.ts` JWT_SECRET / COOKIE_SECRET yoksa BILEREK patlar (fail-closed —
 * workspace guvenlik kurali: secret icin fallback varsayilan YASAK). Dogru davranis
 * bu; ama `bun test` calisirken bu degiskenler tanimli olmadigi icin env'e dokunan
 * her modul import aninda dusuyordu ve 15 banner testi "COOKIE_SECRET eksik"
 * hatasiyla kirikti — testlerin kendisiyle ilgisi yoktu.
 *
 * Cozum env.ts'i gevsetmek DEGIL, test kosumuna kendi degerlerini vermek.
 * Buradaki degerler yalnizca testte kullanilir, uretimde asla yuklenmez
 * (bunfig.toml `[test] preload`).
 *
 * ONEMLI: zaten tanimliysa UZERINE YAZMAZ — gercek bir .env ile kosarken
 * test degerleri gercek degerleri golgelemesin.
 */
const TEST_ONLY_DEFAULTS: Record<string, string> = {
  NODE_ENV: "test",
  JWT_SECRET: "test-only-jwt-secret-not-for-any-deployment",
  COOKIE_SECRET: "test-only-cookie-secret-not-for-any-deployment",
  DB_HOST: "127.0.0.1",
  DB_PORT: "3306",
  DB_USER: "test",
  DB_PASSWORD: "test",
  DB_NAME: "hal_fiyatlari_test",
};

for (const [key, value] of Object.entries(TEST_ONLY_DEFAULTS)) {
  if (!process.env[key]) process.env[key] = value;
}
