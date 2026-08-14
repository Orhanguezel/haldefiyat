import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("public theme token contract", () => {
  it.each(["brand", "success", "warning", "danger", "info", "foreground", "muted", "surface", "background", "border"])(
    "defines the %s token",
    (token) => expect(css).toMatch(new RegExp(`--${token}:\\s+[^;]+;`)),
  );

  it("maps shared semantic aliases to the accessible product theme", () => {
    for (const token of ["success", "warning", "danger", "info"]) {
      expect(css).toMatch(new RegExp(`--color-${token}:\\s+var\\(--${token}\\);`));
    }
    expect(css).toContain("--color-navy:    var(--brand-fg);");
  });
});
