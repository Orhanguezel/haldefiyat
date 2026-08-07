import { describe, expect, test } from "bun:test";
import {
  bannerTargetSpecificity,
  bannerTargetsCanOverlap,
  bannerTargetsMatchContext,
  type BannerTarget,
} from "@/modules/banners/repository";

const target = (scopeType: BannerTarget["scopeType"], scopeValue?: string): BannerTarget => ({ scopeType, scopeValue });

describe("banner hedef kapsamı çakışması", () => {
  test("global hedef her kapsamla çakışır", () => {
    expect(bannerTargetsCanOverlap([target("global")], [target("city", "denizli")])).toBe(true);
    expect(bannerTargetsCanOverlap([], [target("firm", "12")])).toBe(true);
  });

  test("aynı türde ayrık değerler aynı kapasiteyi işgal etmez", () => {
    expect(bannerTargetsCanOverlap([target("city", "denizli")], [target("city", "antalya")])).toBe(false);
    expect(bannerTargetsCanOverlap([target("firm", "12")], [target("firm", "13")])).toBe(false);
  });

  test("aynı değerli ve kesişebilen çoklu kapsamlar çakışır", () => {
    expect(bannerTargetsCanOverlap(
      [target("city", "denizli"), target("category", "meyve")],
      [target("city", "denizli"), target("product", "erik")],
    )).toBe(true);
  });

  test("ortak türlerden biri ayrık ise kapsamlar çakışmaz", () => {
    expect(bannerTargetsCanOverlap(
      [target("city", "denizli"), target("category", "meyve")],
      [target("city", "denizli"), target("category", "sebze")],
    )).toBe(false);
  });
});

describe("banner hedef kabul kriterleri", () => {
  test("Denizli reklamı Antalya bağlamında görünmez", () => {
    const targets = [target("city", "denizli")];
    expect(bannerTargetsMatchContext(targets, { city: "denizli" })).toBe(true);
    expect(bannerTargetsMatchContext(targets, { city: "antalya" })).toBe(false);
  });

  test("erik reklamı ilgisiz ürün bağlamında görünmez", () => {
    const targets = [target("product", "erik")];
    expect(bannerTargetsMatchContext(targets, { product: "erik" })).toBe(true);
    expect(bannerTargetsMatchContext(targets, { product: "domates" })).toBe(false);
  });

  test("firma reklamı yalnız seçilen firma sayfasında görünür", () => {
    const targets = [target("firm", "42")];
    expect(bannerTargetsMatchContext(targets, { firm: "42" })).toBe(true);
    expect(bannerTargetsMatchContext(targets, { firm: "43" })).toBe(false);
  });

  test("çoklu farklı tür hedeflerinin tamamı eşleşmelidir", () => {
    const targets = [target("city", "denizli"), target("category", "meyve")];
    expect(bannerTargetsMatchContext(targets, { city: "denizli", category: "meyve" })).toBe(true);
    expect(bannerTargetsMatchContext(targets, { city: "denizli", category: "sebze" })).toBe(false);
  });

  test("yerel hedef global hedeften daha yüksek önceliklidir", () => {
    expect(bannerTargetSpecificity([target("city", "denizli")])).toBeGreaterThan(bannerTargetSpecificity([target("global")]));
    expect(bannerTargetSpecificity([target("city", "denizli"), target("product", "erik")])).toBe(2);
  });
});
