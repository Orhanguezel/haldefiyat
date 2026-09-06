import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { MarketfiyatiEtlResult } from "./market-scrapers/marketfiyati";

export function retailRunWarnings(result: MarketfiyatiEtlResult, previousOffers?: number): string[] {
  const warnings: string[] = [];
  if (!result.inserted) warnings.push("ZERO_WRITES");
  if (Object.keys(result.offersByChain).length < 3) warnings.push("LOW_CHAIN_COVERAGE");
  if (previousOffers && result.verifiedOffers < previousOffers * 0.7) warnings.push("COVERAGE_DROP_GT_30_PERCENT");
  if (result.searchFailures) warnings.push("SOURCE_SEARCH_ERRORS");
  if (Object.keys(result.writeFailures).length) warnings.push("WRITE_OR_QUARANTINE_FAILURES");
  if (result.throttled) warnings.push("SOURCE_THROTTLED");
  return warnings;
}

/** Append only scheduled runs; manual refreshes cannot satisfy the three-run gate. */
export async function recordScheduledRetailRun(result: MarketfiyatiEtlResult | null, startedAt: number) {
  const directory = join(process.cwd(), "logs");
  const path = join(directory, "retail-scheduled-runs.jsonl");
  await mkdir(directory, { recursive: true });
  const lines = await readFile(path, "utf8").catch(() => "");
  let previousOffers: number | undefined;
  for (const line of lines.trim().split("\n").reverse()) {
    try { const previous = JSON.parse(line); if (previous.policyVersion === 2 && previous.result) { previousOffers = previous.result.verifiedOffers; break; } } catch { /* interrupted prior append */ }
  }
  const warnings = result ? retailRunWarnings(result, previousOffers) : ["RUN_FAILED"];
  const evidence = { policyVersion: 2, executionKind: "scheduled", startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date().toISOString(), durationMs: Date.now() - startedAt, warnings, result };
  await appendFile(path, `${JSON.stringify(evidence)}\n`, "utf8");
  return warnings;
}
