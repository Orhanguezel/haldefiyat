import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const adminSource = readFileSync(new URL("../src/modules/hal-admin/index.ts", import.meta.url), "utf8");
const maintenanceSource = readFileSync(new URL("../src/modules/redirects/repository.ts", import.meta.url), "utf8");

describe("canonical product family unit integrity", () => {
  test("admin coverage only inherits variants with the master unit", () => {
    expect(adminSource).toContain(
      "v.canonical_slug = p.slug AND v.is_active = 1 AND v.unit = p.unit",
    );
    expect(adminSource).not.toContain("SELECT p.id, v.id, v.unit FROM hf_products p");
  });

  test("SEO maintenance uses the same unit guard", () => {
    expect(maintenanceSource).toContain(
      "v.canonical_slug = m.slug AND v.is_active = 1 AND v.unit = m.unit",
    );
    expect(maintenanceSource).toContain(
      "v.canonical_slug = mp.slug AND v.is_active = 1 AND v.unit = mp.unit",
    );
  });
});
