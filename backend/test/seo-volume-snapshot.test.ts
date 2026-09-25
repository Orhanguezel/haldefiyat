import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/modules/seo-volume/index.ts", import.meta.url), "utf8");

describe("GSC search volume snapshot", () => {
  test("zeros stale master values that are absent from the current GSC window", () => {
    expect(source).toContain("WHERE canonical_slug IS NULL AND search_volume > 0");
    expect(source).toContain("AND slug NOT IN");
  });

  test("does not bulk-zero the catalog when GSC has no known product result", () => {
    expect(source).toContain("if (bySlug.size > 0)");
  });
});
