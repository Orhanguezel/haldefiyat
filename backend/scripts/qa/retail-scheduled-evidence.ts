import { readFile } from "node:fs/promises";
const raw = await readFile("logs/retail-scheduled-runs.jsonl", "utf8").catch(() => "");
const runs = raw.trim().split("\n").filter(Boolean).map(line => JSON.parse(line))
  .filter(run => run.policyVersion === 2 && run.executionKind === "scheduled");
const days = [...new Set(runs.map(run => String(run.startedAt).slice(0, 10)))];
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), requiredDistinctDays: 3,
  observedDistinctDays: days.length, observationGate: days.length >= 3 ? "measured" : "pending",
  runs: runs.slice(-3) }, null, 2));
