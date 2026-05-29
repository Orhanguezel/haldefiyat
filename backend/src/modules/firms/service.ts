import { crawlFirms } from "./fetcher";
import { upsertFirm } from "./repository";
import type { FirmEtlOptions, FirmEtlResult } from "./types";

export async function runFirmDirectoryEtl(options: FirmEtlOptions = {}): Promise<FirmEtlResult> {
  const counters = { inserted: 0, updated: 0 };
  const result = await crawlFirms(options, async (firm) => {
    const status = await upsertFirm(firm);
    counters[status]++;
  });
  result.inserted = counters.inserted;
  result.updated = counters.updated;
  return result;
}
