// =============================================================
// FILE: src/modules/wallet/admin.repository.ts
// Admin wallet DB queries
// =============================================================
import { db } from '../../db/client';
import { randomUUID } from 'crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { wallets, walletTransactions, type NewWallet, type NewWalletTransaction } from './schema';
import { users } from '@agro/shared-backend/modules/auth/schema';

type WalletStatus = NewWallet['status'];
type WalletPaymentStatus = NewWalletTransaction['payment_status'];
type WalletBalancePatch = Pick<NewWallet, 'balance' | 'total_earnings' | 'total_withdrawn'>;

const WALLET_SELECT = {
  id: wallets.id,
  user_id: wallets.user_id,
  email: users.email,
  full_name: users.full_name,
  balance: wallets.balance,
  total_earnings: wallets.total_earnings,
  total_withdrawn: wallets.total_withdrawn,
  currency: wallets.currency,
  status: wallets.status,
  created_at: wallets.created_at,
  updated_at: wallets.updated_at,
} as const;

export async function repoAdminListWallets(params: { limit: number; offset: number }) {
  const rows = await db
    .select(WALLET_SELECT)
    .from(wallets)
    .leftJoin(users, eq(wallets.user_id, users.id))
    .orderBy(desc(wallets.created_at))
    .limit(params.limit)
    .offset(params.offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(wallets);

  return { data: rows, total: Number(count) };
}

export async function repoAdminGetWallet(id: string) {
  const [row] = await db
    .select(WALLET_SELECT)
    .from(wallets)
    .leftJoin(users, eq(wallets.user_id, users.id))
    .where(eq(wallets.id, id))
    .limit(1);

  return row ?? null;
}

export async function repoAdminUpdateWalletStatus(id: string, status: WalletStatus) {
  await db.update(wallets).set({ status }).where(eq(wallets.id, id));
}

export async function repoAdminAdjustWallet(data: {
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  purpose: string;
  description?: string | null;
  payment_status: WalletPaymentStatus;
}) {
  // Get or create wallet
  let [wallet] = await db.select().from(wallets).where(eq(wallets.user_id, data.user_id)).limit(1);
  if (!wallet) {
    const wid = randomUUID();
    await db.insert(wallets).values({ id: wid, user_id: data.user_id });
    [wallet] = await db.select().from(wallets).where(eq(wallets.id, wid)).limit(1);
  }

  const txId = randomUUID();
  await db.insert(walletTransactions).values({
    id: txId,
    wallet_id: wallet.id,
    user_id: data.user_id,
    type: data.type,
    amount: data.amount.toString(),
    purpose: data.purpose,
    description: data.description ?? null,
    payment_status: data.payment_status,
    is_admin_created: 1,
  });

  if (data.payment_status === 'completed') {
    const current = parseFloat(wallet.balance);
    const newBalance = data.type === 'credit' ? current + data.amount : Math.max(0, current - data.amount);
    const updates: WalletBalancePatch = { balance: newBalance.toFixed(2) };
    if (data.type === 'credit') {
      updates.total_earnings = (parseFloat(wallet.total_earnings) + data.amount).toFixed(2);
    } else {
      updates.total_withdrawn = (parseFloat(wallet.total_withdrawn) + data.amount).toFixed(2);
    }
    await db.update(wallets).set(updates).where(eq(wallets.id, wallet.id));
  }

  return txId;
}

export async function repoAdminListTransactions(walletId: string, params: { limit: number; offset: number }) {
  const rows = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.wallet_id, walletId))
    .orderBy(desc(walletTransactions.created_at))
    .limit(params.limit)
    .offset(params.offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(walletTransactions)
    .where(eq(walletTransactions.wallet_id, walletId));

  return { data: rows, total: Number(count) };
}

export async function repoAdminUpdateTransactionStatus(id: string, newStatus: WalletPaymentStatus) {
  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, id)).limit(1);
  if (!tx) return null;

  const prevStatus = tx.payment_status;
  await db.update(walletTransactions).set({ payment_status: newStatus }).where(eq(walletTransactions.id, id));

  // Apply balance change if transitioning to completed
  if (prevStatus !== 'completed' && newStatus === 'completed') {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, tx.wallet_id)).limit(1);
    if (wallet) {
      const amount = parseFloat(tx.amount);
      const current = parseFloat(wallet.balance);
      const newBalance = tx.type === 'credit' ? current + amount : Math.max(0, current - amount);
      const updates: WalletBalancePatch = { balance: newBalance.toFixed(2) };
      if (tx.type === 'credit') {
        updates.total_earnings = (parseFloat(wallet.total_earnings) + amount).toFixed(2);
      } else {
        updates.total_withdrawn = (parseFloat(wallet.total_withdrawn) + amount).toFixed(2);
      }
      await db.update(wallets).set(updates).where(eq(wallets.id, wallet.id));
    }
  }

  return tx;
}
