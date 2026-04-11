// src/modules/dealerFinance/service.ts
import { randomUUID } from 'crypto';
import {
  repoGetDealerProfile,
  repoGetDealerProfileById,
  repoCreateTransaction,
  repoUpdateDealerBalance,
} from './repository';

type CreditCheckResult = {
  ok: boolean;
  available: number;
  limit: number;
};

/** Check if dealer has enough credit for an order */
export async function checkCreditLimit(
  userId: string,
  orderTotal: number,
): Promise<CreditCheckResult> {
  const profile = repoGetDealerProfile(userId);
  const dealer = await profile;

  if (!dealer) {
    return { ok: false, available: 0, limit: 0 };
  }

  const limit = parseFloat(dealer.credit_limit);
  const balance = parseFloat(dealer.current_balance);
  // available = limit - current balance (positive balance = debt)
  const available = limit - balance;

  return {
    ok: available >= orderTotal,
    available,
    limit,
  };
}

/**
 * Record an order transaction (debit).
 * Positive amount = dealer owes more.
 */
export async function recordOrderTransaction(
  dealerId: string,
  orderId: string,
  amount: number,
): Promise<{ ok: boolean; error?: string }> {
  const dealer = await repoGetDealerProfileById(dealerId);
  if (!dealer) return { ok: false, error: 'dealer_not_found' };

  const currentBalance = parseFloat(dealer.current_balance);
  const creditLimit = parseFloat(dealer.credit_limit);
  const available = creditLimit - currentBalance;

  if (available < amount) {
    return { ok: false, error: 'insufficient_credit' };
  }

  const newBalance = currentBalance + amount;
  const txId = randomUUID();

  await repoCreateTransaction({
    id: txId,
    dealer_id: dealerId,
    order_id: orderId,
    type: 'order',
    amount: String(amount),
    balance_after: String(newBalance),
    description: null,
    due_date: null,
    created_by: null,
  });

  await repoUpdateDealerBalance(dealerId, String(newBalance));

  return { ok: true };
}

/**
 * Record a payment transaction (credit).
 * Negative amount = reduces dealer debt.
 */
export async function recordPayment(
  dealerId: string,
  amount: number,
  description: string | null,
  adminId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const dealer = await repoGetDealerProfileById(dealerId);
  if (!dealer) return { ok: false, error: 'dealer_not_found' };

  const currentBalance = parseFloat(dealer.current_balance);
  // payment reduces balance (negative amount)
  const newBalance = currentBalance - amount;
  const txId = randomUUID();

  await repoCreateTransaction({
    id: txId,
    dealer_id: dealerId,
    order_id: null,
    type: 'payment',
    amount: String(-amount),
    balance_after: String(newBalance),
    description: description ?? null,
    due_date: null,
    created_by: adminId,
  });

  await repoUpdateDealerBalance(dealerId, String(newBalance));

  return { ok: true };
}
