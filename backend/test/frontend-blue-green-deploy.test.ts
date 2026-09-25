import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const deploy = readFileSync(new URL("../../deploy.sh", import.meta.url), "utf8");
const switcher = readFileSync(new URL("../../scripts/frontend-blue-green.sh", import.meta.url), "utf8");

describe("frontend blue-green deploy", () => {
  test("deploy uses the blue-green switcher instead of the two-worker cluster gate", () => {
    expect(deploy).toContain('frontend-blue-green.sh deploy "$TARGET"');
    expect(deploy).not.toContain("cluster iki worker degil");
  });

  test("candidate is healthy before nginx changes and rollback is available", () => {
    expect(switcher.indexOf('health "$candidate_port"')).toBeLessThan(
      switcher.indexOf('switch_upstream "$candidate_port"'),
    );
    expect(switcher).toContain('switch_upstream "$old_port"');
  });

  test("release cleanup preserves both running frontend slots", () => {
    expect(deploy).toContain("ACTIVE_FRONTEND_DISTS");
    expect(deploy).toContain('grep -Fxq "$base"');
  });
});
