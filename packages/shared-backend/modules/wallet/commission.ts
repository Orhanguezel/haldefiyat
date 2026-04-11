// src/modules/wallet/commission.ts
// Platform komisyon hesaplama servisi

import { repoGetFirstRowByFallback } from "@agro/shared-backend/modules/siteSettings/repository";

export interface CommissionConfig {
  rate: number;
  type: "percentage";
}

const DEFAULT_CONFIG: CommissionConfig = { rate: 0, type: "percentage" };

export async function getCommissionRate(): Promise<CommissionConfig> {
  const row = await repoGetFirstRowByFallback("platform_commission", ["*", "tr"]);
  if (!row) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(row.value) as CommissionConfig;
    if (typeof parsed.rate !== "number" || parsed.rate < 0 || parsed.rate > 100) return DEFAULT_CONFIG;
    return { rate: parsed.rate, type: "percentage" };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function calculateCarrierPayout(totalPrice: number, rate: number) {
  const commissionAmount = Math.round(totalPrice * (rate / 100) * 100) / 100;
  const carrierPayout = Math.round((totalPrice - commissionAmount) * 100) / 100;
  return { carrierPayout, commissionAmount };
}
