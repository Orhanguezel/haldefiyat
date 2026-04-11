// src/modules/wallet/service.ts
import { randomUUID } from "crypto";
import { db } from '../../db/client';
import { eq, sql } from "drizzle-orm";
import { wallets, walletTransactions } from "./schema";
import { getOrCreateWallet, invalidateWalletCachesForUsers } from './helpers';

/** Müşteriden booking bedeli düş */
export async function deductForBooking(userId: string, amount: number, bookingId: string): Promise<void> {
  const wallet = await getOrCreateWallet(userId);
  const balance = parseFloat(wallet.balance);
  if (balance < amount) throw new Error("insufficient_balance");

  await db.transaction(async (tx) => {
    await tx.update(wallets)
      .set({ balance: sql`balance - ${amount}` })
      .where(eq(wallets.id, wallet.id));

    await tx.insert(walletTransactions).values({
      id: randomUUID(),
      wallet_id: wallet.id,
      user_id: userId,
      type: "debit",
      amount: amount.toFixed(2),
      purpose: "booking_payment",
      description: `Booking #${bookingId} ödemesi`,
      payment_status: "completed",
      transaction_ref: bookingId,
    });
  });
  await invalidateWalletCachesForUsers([userId]);
}

/** Taşıyıcıya teslim sonrası ödeme aktar */
export async function creditCarrier(carrierId: string, amount: number, bookingId: string): Promise<void> {
  const wallet = await getOrCreateWallet(carrierId);

  await db.transaction(async (tx) => {
    await tx.update(wallets)
      .set({
        balance: sql`balance + ${amount}`,
        total_earnings: sql`total_earnings + ${amount}`,
      })
      .where(eq(wallets.id, wallet.id));

    await tx.insert(walletTransactions).values({
      id: randomUUID(),
      wallet_id: wallet.id,
      user_id: carrierId,
      type: "credit",
      amount: amount.toFixed(2),
      purpose: "booking_earning",
      description: `Booking #${bookingId} kazancı`,
      payment_status: "completed",
      transaction_ref: bookingId,
    });
  });
  await invalidateWalletCachesForUsers([carrierId]);
}

/** İptal halinde müşteriye iade */
export async function refundToCustomer(userId: string, amount: number, bookingId: string): Promise<void> {
  const wallet = await getOrCreateWallet(userId);

  await db.transaction(async (tx) => {
    await tx.update(wallets)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(wallets.id, wallet.id));

    await tx.insert(walletTransactions).values({
      id: randomUUID(),
      wallet_id: wallet.id,
      user_id: userId,
      type: "credit",
      amount: amount.toFixed(2),
      purpose: "booking_refund",
      description: `Booking #${bookingId} iadesi`,
      payment_status: "refunded",
      transaction_ref: bookingId,
    });
  });
  await invalidateWalletCachesForUsers([userId]);
}
