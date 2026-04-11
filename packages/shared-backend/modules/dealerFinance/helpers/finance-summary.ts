// src/modules/dealerFinance/helpers/finance-summary.ts
import type { DealerProfileRow } from '../schema';
import type { TransactionType } from '../schema';

export function buildFinanceSummaryPayload(
  profile: DealerProfileRow,
  totalsByType: Record<TransactionType, number>,
  txCount: number,
  overdueCount: number,
) {
  const limit = parseFloat(profile.credit_limit);
  const balance = parseFloat(profile.current_balance);
  const available = limit - balance;
  const warnings: string[] = [];
  if (limit > 0 && available < limit * 0.1) warnings.push('low_credit');
  if (overdueCount > 0) warnings.push('overdue_due');

  return {
    credit_limit: limit,
    current_balance: balance,
    available,
    discount_rate: parseFloat(profile.discount_rate),
    transaction_count: txCount,
    totals_by_type: totalsByType,
    overdue_count: overdueCount,
    warnings,
  };
}
